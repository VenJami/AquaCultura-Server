const express = require("express");
const router = express.Router();
const teamsController = require("../controllers/teamsController");
const { check } = require("express-validator");
const { protect } = require("../middleware/auth");
const Team = require("../models/Team");

// Validation middleware
const teamValidation = [
  check("name", "Name is required").not().isEmpty(),
  check("description", "Description is required").not().isEmpty(),
  check("leadId", "Team lead ID is required").not().isEmpty(),
  check("leadName", "Team lead name is required").not().isEmpty(),
];

// Get all teams
router.get("/", protect, teamsController.getTeams);

// Get single team
router.get("/:id", protect, teamsController.getTeam);

// Create team
router.post("/", [protect, ...teamValidation], teamsController.createTeam);

// Update team
router.put("/:id", [protect, ...teamValidation], teamsController.updateTeam);

// Delete team
router.delete("/:id", protect, teamsController.deleteTeam);

// @route   POST api/teams/:id/members
// @desc    Add member to team
// @access  Private
router.post("/:id/members", protect, teamsController.addMember);

// @route   DELETE api/teams/:id/members
// @desc    Remove member from team
// @access  Private
router.delete("/:id/members", protect, teamsController.removeMember);

// Get team by name
router.get('/byName/:name', async (req, res) => {
  try {
    const team = await Team.findOne({ name: req.params.name });
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    res.status(200).json(team);
  } catch (error) {
    console.error('Error fetching team by name:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
