import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '@prisma/client';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<Omit<User, 'password'>>;
    findAll(): Promise<Omit<User, 'password'>[]>;
}
