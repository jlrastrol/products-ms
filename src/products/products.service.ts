import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from 'generated/prisma';
import { PaginationDto } from 'src/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger(ProductsService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }
  create(createProductDto: CreateProductDto) {
    return this.product.create({data: createProductDto});
  }

  async findAll(paginarionDto: PaginationDto) {
    const { limit = 10, page = 1 } = paginarionDto;
    const totalPages =  await this.product.count({
      where: { available: true }
    });
    const lastPage = Math.ceil(totalPages / limit);
    return {
      data: await this.product.findMany({
        where: { available: true }, 
          'take': limit,
          'skip': (page - 1) * limit  
        }),
      meta:{
        total: totalPages,
        page,
        lastPage
      },

  }
  }

  async findOne(id: number) {
    const product = await this.product.findUnique({
      where: { id, available: true }
    });

    if(!product){
      throw new RpcException(`Product with id ${id} not found`);
    }
    return product
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id: _, ...data } = updateProductDto;

    await this.findOne(id);

    return await this.product.update({
      where: { id },
      data
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    /*return await this.product.delete({
      where: { id }
      });*/
    const product = await this.product.update({
      where: { id },
      data: { available: false }
    });
    return product;
  }

  async validateProduct(ids: number[]){
    ids = Array.from(new Set(ids));
    const products = await this.product.findMany({
      where: {
        id: { in: ids },
        available: true
      }
    });

    if(products.length !== ids.length){
      throw new RpcException({
        message: 'Some products are not available',
        status: HttpStatus.BAD_REQUEST
      });
    }

    return products;
  }


}
