import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart' as io;
import 'package:shelf_router/shelf_router.dart';
import 'package:shelf_cors_headers/shelf_cors_headers.dart';
import 'package:dotenv/dotenv.dart' as dotenv;

import 'routes/auth_routes.dart';
import 'routes/attendance_routes.dart';
import 'routes/batch_routes.dart';
import 'routes/notification_routes.dart';
import 'routes/task_routes.dart';

void main() async {
  // Load environment variables
  dotenv.load();

  // Create router
  final router = Router()
    ..mount('/auth', authRoutes)
    ..mount('/attendance', attendanceRoutes)
    ..mount('/batch', batchRoutes)
    ..mount('/notification', notificationRoutes)
    ..mount('/task', taskRoutes);

  // Create handler with CORS headers
  final handler = Pipeline()
      .addMiddleware(corsHeaders())
      .addMiddleware(logRequests())
      .addHandler(router);

  // Start server
  final server = await io.serve(
    handler,
    '0.0.0.0',
    int.parse(dotenv.env['PORT'] ?? '8080'),
  );

  print('Server running on ${server.address.host}:${server.port}');
} 