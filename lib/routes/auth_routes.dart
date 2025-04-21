import 'package:shelf_router/shelf_router.dart';
import 'package:shelf/shelf.dart';

final authRoutes = Router()
  ..post('/login', _loginHandler)
  ..post('/register', _registerHandler)
  ..post('/change-password', _changePasswordHandler);

Future<Response> _loginHandler(Request request) async {
  // TODO: Implement login logic
  return Response.ok('Login endpoint');
}

Future<Response> _registerHandler(Request request) async {
  // TODO: Implement registration logic
  return Response.ok('Register endpoint');
}

Future<Response> _changePasswordHandler(Request request) async {
  // TODO: Implement change password logic
  return Response.ok('Change password endpoint');
} 