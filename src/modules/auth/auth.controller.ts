import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard'; // Asegúrate de que la ruta sea correcta

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Endpoint para iniciar sesión
   * POST /auth/login
   */
  @Post('login')
  async login(@Body() body: any) {
    // Extraemos las credenciales del cuerpo de la petición
    return this.authService.login(body.username, body.password);
  }

  /**
   * Endpoint para registrar un nuevo usuario
   * POST /auth/register
   */
  @Post('register')
  async register(@Body() body: any) {
    // Enviamos username, email y password al servicio
    return this.authService.register(body.username, body.email, body.password);
  }

  /**
   * Endpoint protegido para obtener los datos del usuario logueado
   * GET /auth/profile
   * * @UseGuards(JwtAuthGuard) verifica que el token enviado en el Header 
   * (Authorization: Bearer <token>) sea válido.
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    /**
     * El Guard de JWT inyecta en el objeto 'req.user' los datos que extrae del token.
     * Importante: Asegúrate de que tu JwtStrategy devuelva 'userId'.
     */
    return this.authService.getProfile(req.user.userId);
  }
}