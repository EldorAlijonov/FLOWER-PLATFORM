import { Injectable } from '@nestjs/common';

@Injectable()
export class CrmAdminService {
  getDashboard() {
    return {
      shop: {
        id: '7f4c522f-2c9a-4fc8-a7f7-e255fc63ef64',
        name: 'Lola Gullari',
        status: 'ACTIVE',
      },
      metrics: [
        { label: 'Bugungi savdo', value: "4 820 000 so'm", trend: '+18%', tone: 'emerald' },
        { label: 'Ochiq buyurtmalar', value: '14', trend: '6 tasi shoshilinch', tone: 'sky' },
        { label: 'Kam qolgan mahsulotlar', value: '5', trend: "zaxira to'ldirish kerak", tone: 'amber' },
        { label: 'Yangi mijozlar', value: '23', trend: '+7 bugun', tone: 'rose' },
      ],
      orders: [
        {
          id: '8b0f7b7e-1e73-46e4-9e68-9b7ea4f0d3ad',
          customerName: 'Madina Karimova',
          bouquetName: 'Pushti lola qutisi',
          status: 'NEW',
          deliveryTime: '10:30',
          totalAmount: 420000,
        },
        {
          id: '6f8eecf7-92c1-4f78-9d7f-93f9a5250d30',
          customerName: 'Azizbek Rahimov',
          bouquetName: 'Premium atirgul to‘plami',
          status: 'PREPARING',
          deliveryTime: '11:45',
          totalAmount: 680000,
        },
        {
          id: 'fdce6b7d-a9ab-4a69-bf7d-bb7f9f8a1895',
          customerName: 'Nodira Salimova',
          bouquetName: 'Oq orxideya savati',
          status: 'READY',
          deliveryTime: '13:00',
          totalAmount: 550000,
        },
        {
          id: '7fdc5d65-28ec-4a92-a680-df6de3cfd6da',
          customerName: 'Jasur Aliyev',
          bouquetName: "Tug‘ilgan kun kungaboqar to‘plami",
          status: 'DELIVERING',
          deliveryTime: '14:20',
          totalAmount: 310000,
        },
      ],
      products: [
        {
          id: 'd7e354ff-a9db-4ad8-9d18-f3343266a701',
          name: 'Qizil atirgul',
          stock: 128,
          price: 22000,
          status: 'ACTIVE',
        },
        {
          id: 'ab078e96-a5a3-4cb1-b71e-34780a1cfcb7',
          name: 'Pushti lola',
          stock: 18,
          price: 18000,
          status: 'LOW_STOCK',
        },
        {
          id: '99f987bd-c7a1-4951-931c-92c9c7aa123d',
          name: 'Oq orxideya',
          stock: 9,
          price: 95000,
          status: 'LOW_STOCK',
        },
        {
          id: '8bbbd8ad-8813-4071-8496-8973d77d51bc',
          name: 'Kungaboqar',
          stock: 64,
          price: 16000,
          status: 'ACTIVE',
        },
      ],
    };
  }
}
