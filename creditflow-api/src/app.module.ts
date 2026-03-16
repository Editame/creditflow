import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { RutasModule } from './rutas/rutas.module';
import { ClientesModule } from './clientes/clientes.module';
import { PrestamosModule } from './prestamos/prestamos.module';
import { PagosModule } from './pagos/pagos.module';
import { GastosModule } from './gastos/gastos.module';
import { TenantsModule } from './tenants/tenants.module';
import { LicenseModule } from './license/license.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ChargeConceptsModule } from './charge-concepts/charge-concepts.module';

import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    AdminModule,
    TenantsModule,
    LicenseModule,
    UsuariosModule,
    ChargeConceptsModule,
    RolesModule,
    PermissionsModule,
    DashboardModule,
    ReportsModule,
    RutasModule,
    ClientesModule,
    PrestamosModule,
    PagosModule,
    GastosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
