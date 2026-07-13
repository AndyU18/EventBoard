import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { Severity } from '@prisma/client';

export class PublishEventDto {
  @ApiProperty({ example: 'USER_CREATED', description: 'El tipo de evento (ej: USER_CREATED, DOCUMENT_APPROVED)' })
  @IsString()
  @IsNotEmpty({ message: 'El tipo de evento es obligatorio' })
  type: string;

  @ApiProperty({ example: 'auth', description: 'Módulo de origen del evento' })
  @IsString()
  @IsNotEmpty({ message: 'El módulo de origen es obligatorio' })
  sourceModule: string;

  @ApiProperty({ example: { email: 'juan@gmail.com', name: 'Juan' }, description: 'Payload del evento con datos específicos' })
  @IsObject()
  @IsNotEmpty({ message: 'El payload es obligatorio' })
  payload: Record<string, any>;

  @ApiProperty({ example: 'some-uuid-here', description: 'ID del usuario asociado (opcional)', required: false })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ example: 'INFO', enum: Severity, description: 'Severidad del evento', required: false })
  @IsEnum(Severity, { message: 'La severidad no es válida' })
  @IsOptional()
  severity?: Severity;
}
