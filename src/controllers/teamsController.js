const Team = require("../models/Team");
const User = require("../models/User");
const { validationResult } = require("express-validator");

// Get all teams
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("leadId", "name email")
      .populate("members", "name email");
    res.json(teams);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get single team
exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("leadId", "name email")
      .populate("members", "name email");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json(team);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Team not found" });
    }
    res.status(500).json({ message: "Server Error" });
  }
};

// Create team
exports.createTeam = async (req, res) => {
  try {
    const { name, description, leadId, leadName } = req.body;

    // Check if lead exists
    const lead = await User.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: "Team lead not found" });
    }

    const newTeam = new Team({
      name,
      description,
      leadId,
      leadName,
      members: [leadId], // Add lead as first member
    });

    const team = await newTeam.save();
    
    // Update the lead's team information
    await User.findByIdAndUpdate(leadId, { 
      team: team._id,
      teamName: team.name
    });

    res.status(201).json(team);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update team
exports.updateTeam = async (req, res) => {
  try {
    const { name, description, leadId, leadName, members } = req.body;
    const teamId = req.params.id;
    
    // Get the current team to check for lead changes and member changes
    const currentTeam = await Team.findById(teamId);
    if (!currentTeam) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if lead exists if being changed
    let newLead = null;
    if (leadId && leadId !== currentTeam.leadId.toString()) {
      newLead = await User.findById(leadId);
      if (!newLead) {
        return res.status(404).json({ message: "Team lead not found" });
      }
    }

    const updatedFields = {};
    if (name) updatedFields.name = name;
    if (description) updatedFields.description = description;
    if (leadId) updatedFields.leadId = leadId;
    if (leadName) updatedFields.leadName = leadName;
    
    // Process members if provided
    if (members) {
      // Validate members exist
      for (const memberId of members) {
        const memberExists = await User.exists({ _id: memberId });
        if (!memberExists) {
          return res.status(404).json({ 
            message: `Member with ID ${memberId} not found`
          });
        }
      }
      
      // Set the members field in the update
      updatedFields.members = members;
      
      console.log(`Team ${teamId} members updated: ${members.join(', ')}`);
    }

    // Update the team with new data
    const team = await Team.findByIdAndUpdate(
      teamId,
      updatedFields,
      { new: true }
    );

    // If team name changed, update all team members' teamName field
    if (name && name !== currentTeam.name) {
      await User.updateMany(
        { team: teamId },
        { teamName: name }
      );
    }

    // If lead changed, update the new lead's team info
    if (newLead) {
      // Update new lead's team info
      await User.findByIdAndUpdate(leadId, { 
        team: teamId,
        teamName: team.name
      });
      
      // If old lead is not in the members array anymore, clear their team info
      const oldLeadStillMember = team.members.some(
        memberId => memberId.toString() === currentTeam.leadId.toString()
      );
      
      if (!oldLeadStillMember) {
        await User.findByIdAndUpdate(currentTeam.leadId, { 
          team: null,
          teamName: ""
        });
      }
    }
    
    // Handle member changes if members array was provided
    if (members) {
      // Find added members (in new list but not in old list)
      const currentMemberIds = currentTeam.members.map(id => id.toString());
      const newMemberIds = members;
      
      // Added members - in new list but not in old list
      const addedMembers = newMemberIds.filter(id => !currentMemberIds.includes(id));
      
      // Removed members - in old list but not in new list
      const removedMembers = currentMemberIds.filter(id => !newMemberIds.includes(id));
      
      console.log(`Added members: ${addedMembers.join(', ')}`);
      console.log(`Removed members: ${removedMembers.join(', ')}`);
      
      // Update added members with team reference
      if (addedMembers.length > 0) {
        await User.updateMany(
          { _id: { $in: addedMembers } },
          { team: teamId, teamName: team.name }
        );
      }
      
      // Clear team reference for removed members
      if (removedMembers.length > 0) {
        await User.updateMany(
          { _id: { $in: removedMembers } },
          { team: null, teamName: "" }
        );
      }
    }

    res.json(team);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Team not found" });
    }
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete team
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Remove team reference from all team members
    await User.updateMany(
      { team: team._id },
      { team: null, teamName: "" }
    );

    await Team.deleteOne({ _id: req.params.id });
    res.json({ message: "Team removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Team not found" });
    }
    res.status(500).json({ message: "Server Error" });
  }
};

// Add member to team
exports.addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const teamId = req.params.id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if user is already a member
    if (team.members.includes(userId)) {
      return res
        .status(400)
        .json({ message: "User is already a member of this team" });
    }

    // Add user to team
    team.members.push(userId);
    await team.save();

    // Update user's team information
    await User.findByIdAndUpdate(userId, {
      team: teamId,
      teamName: team.name
    });

    res.json(team);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Team or User not found" });
    }
    res.status(500).json({ message: "Server Error" });
  }
};

// Remove member from team
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const teamId = req.params.id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if user is a member
    if (!team.members.includes(userId)) {
      return res
        .status(400)
        .json({ message: "User is not a member of this team" });
    }

    // Don't allow removing the team lead
    if (team.leadId.toString() === userId) {
      return res
        .status(400)
        .json({ message: "Cannot remove team lead from team" });
    }

    // Remove user from team members list
    team.members = team.members.filter(
      (memberId) => memberId.toString() !== userId
    );
    await team.save();

    // Clear user's team information
    await User.findByIdAndUpdate(userId, {
      team: null,
      teamName: ""
    });

    res.json(team);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Team or User not found" });
    }
    res.status(500).json({ message: "Server Error" });
  }
};
