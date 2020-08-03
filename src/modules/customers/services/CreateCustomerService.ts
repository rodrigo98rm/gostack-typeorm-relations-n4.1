import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Customer from '../infra/typeorm/entities/Customer';
import ICustomersRepository from '../repositories/ICustomersRepository';

interface IRequest {
  name: string;
  email: string;
}

@injectable()
class CreateCustomerService {
  constructor(
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ name, email }: IRequest): Promise<Customer> {
    // Check if email is in use
    const user = await this.customersRepository.findByEmail(email);
    if (user) {
      throw new AppError('Email already in use', 400);
    }

    const newUser = await this.customersRepository.create({ name, email });

    return newUser;
  }
}

export default CreateCustomerService;
