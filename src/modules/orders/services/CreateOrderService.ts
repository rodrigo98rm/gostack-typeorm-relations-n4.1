import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IFullProduct {
  product_id: string;
  price: number;
  quantity: number;
}

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    // Check if customer exists
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found', 400);
    }

    // Check if all products exist
    const fullProducts = await this.productsRepository.findAllById(products);

    if (fullProducts.length !== products.length) {
      throw new AppError('One or more products do not exist', 400);
    }

    const productsArray: IFullProduct[] = [];

    products.forEach(product => {
      const full = fullProducts.find(
        fullProduct => fullProduct.id === product.id,
      );

      if (!full) {
        throw new AppError('Product not found', 400);
      }

      if (product.quantity > full.quantity) {
        throw new AppError(`Insufficient amount of ${full.name}`, 400);
      }

      productsArray.push({
        price: full.price,
        product_id: product.id,
        quantity: product.quantity,
      });
    });

    await this.productsRepository.updateQuantity(products);

    // Create Order
    const order = await this.ordersRepository.create({
      customer,
      products: productsArray,
    });

    return order;
  }
}

export default CreateOrderService;
