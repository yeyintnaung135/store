import type { PrismaClient } from '../../src/generated/prisma/client.js';

export async function seedProducts(prisma: PrismaClient) {
  const category = await prisma.category.findUniqueOrThrow({
    where: { slug: 'electronics' },
  });

  const products = [
    {
      name: 'Wireless Headphones',
      slug: 'wireless-headphones',
      description:
        'Enjoy immersive sound with comfortable wireless headphones for music, gaming, and everyday use.',
      price: '59.99',
      stock: 25,
    },
    {
      name: 'Mechanical Keyboard',
      slug: 'mechanical-keyboard',
      description:
        'A durable mechanical keyboard with responsive keys for typing, programming, and gaming.',
      price: '89.99',
      stock: 15,
    },
    {
      name: 'Wireless Mouse',
      slug: 'wireless-mouse',
      description:
        'A compact wireless mouse with precise tracking and reliable connectivity for everyday computing.',
      price: '29.99',
      stock: 40,
    },
    {
      name: 'Gaming Mouse',
      slug: 'gaming-mouse',
      description:
        'A high-precision gaming mouse designed for fast response, accurate tracking, and comfortable gameplay.',
      price: '49.99',
      stock: 20,
    },
    {
      name: 'USB-C Hub',
      slug: 'usb-c-hub',
      description:
        'Expand your laptop connectivity with a versatile USB-C hub for connecting multiple devices.',
      price: '39.99',
      stock: 30,
    },
    {
      name: 'Laptop Stand',
      slug: 'laptop-stand',
      description:
        'An ergonomic laptop stand that improves screen height and helps create a more comfortable workspace.',
      price: '34.99',
      stock: 18,
    },
    {
      name: 'Webcam HD',
      slug: 'webcam-hd',
      description:
        'Capture clear video for online meetings, remote work, live streaming, and video calls.',
      price: '69.99',
      stock: 12,
    },
    {
      name: 'Bluetooth Speaker',
      slug: 'bluetooth-speaker',
      description:
        'Enjoy portable wireless audio with a compact speaker suitable for home use and outdoor activities.',
      price: '45.99',
      stock: 22,
    },
    {
      name: 'Portable SSD 1TB',
      slug: 'portable-ssd-1tb',
      description:
        'Store and transfer large files with a portable 1TB solid-state drive for work and personal use.',
      price: '99.99',
      stock: 10,
    },
    {
      name: 'USB Flash Drive 64GB',
      slug: 'usb-flash-drive-64gb',
      description:
        'A convenient 64GB USB flash drive for transferring documents, photos, videos, and other files.',
      price: '12.99',
      stock: 50,
    },
    {
      name: 'USB-C Charger 65W',
      slug: 'usb-c-charger-65w',
      description:
        'A compact 65W USB-C charger for compatible laptops, tablets, and smartphones.',
      price: '35.99',
      stock: 28,
    },
    {
      name: 'Wireless Charging Pad',
      slug: 'wireless-charging-pad',
      description:
        'Conveniently charge compatible wireless-charging devices by placing them on this charging pad.',
      price: '24.99',
      stock: 35,
    },
    {
      name: 'Power Bank 20000mAh',
      slug: 'power-bank-20000mah',
      description:
        'A high-capacity 20000mAh power bank for keeping compatible mobile devices charged while travelling.',
      price: '49.99',
      stock: 24,
    },
    {
      name: 'HDMI Cable 2m',
      slug: 'hdmi-cable-2m',
      description:
        'A 2-meter HDMI cable for connecting compatible computers, consoles, monitors, and televisions.',
      price: '9.99',
      stock: 60,
    },
    {
      name: 'DisplayPort Cable',
      slug: 'displayport-cable',
      description:
        'Connect compatible computers and displays with a reliable DisplayPort cable for video output.',
      price: '14.99',
      stock: 32,
    },
    {
      name: '27-inch Monitor',
      slug: '27-inch-monitor',
      description:
        'A 27-inch monitor suitable for office work, programming, entertainment, and everyday computing.',
      price: '249.99',
      stock: 8,
    },
    {
      name: 'Gaming Monitor 144Hz',
      slug: 'gaming-monitor-144hz',
      description:
        'A gaming monitor with a 144Hz refresh rate for smoother motion in supported games.',
      price: '329.99',
      stock: 6,
    },
    {
      name: 'Laptop Cooling Pad',
      slug: 'laptop-cooling-pad',
      description:
        'A laptop cooling pad designed to improve airflow around your laptop during extended use.',
      price: '27.99',
      stock: 16,
    },
    {
      name: 'Bluetooth Keyboard',
      slug: 'bluetooth-keyboard',
      description:
        'A wireless Bluetooth keyboard for typing comfortably across compatible computers and mobile devices.',
      price: '54.99',
      stock: 19,
    },
    {
      name: 'Noise Cancelling Headphones',
      slug: 'noise-cancelling-headphones',
      description:
        'Listen with greater focus using headphones designed to reduce surrounding noise during compatible use.',
      price: '129.99',
      stock: 11,
    },
    {
      name: 'Wired Earphones',
      slug: 'wired-earphones',
      description:
        'Lightweight wired earphones for listening to music, watching videos, and taking compatible calls.',
      price: '14.99',
      stock: 45,
    },
    {
      name: 'USB Microphone',
      slug: 'usb-microphone',
      description:
        'A USB microphone for recording voice, joining online meetings, podcasting, and streaming.',
      price: '79.99',
      stock: 13,
    },
    {
      name: 'Studio Headset',
      slug: 'studio-headset',
      description:
        'A comfortable over-ear headset for audio monitoring, communication, and extended computer sessions.',
      price: '89.99',
      stock: 9,
    },
    {
      name: 'Smart Watch',
      slug: 'smart-watch',
      description:
        'A smartwatch for viewing notifications, checking activity information, and using compatible smart features.',
      price: '119.99',
      stock: 14,
    },
    {
      name: 'Fitness Tracker',
      slug: 'fitness-tracker',
      description:
        'Track everyday activity and view fitness information with a wearable tracker and compatible app.',
      price: '59.99',
      stock: 21,
    },
    {
      name: 'Wi-Fi Router',
      slug: 'wi-fi-router',
      description:
        'A wireless router for creating a home or small-office network with compatible internet equipment.',
      price: '74.99',
      stock: 17,
    },
    {
      name: 'Mesh Wi-Fi System',
      slug: 'mesh-wi-fi-system',
      description:
        'A mesh Wi-Fi system designed to extend wireless network coverage across multiple areas of a home.',
      price: '199.99',
      stock: 5,
    },
    {
      name: 'Network Switch 8-Port',
      slug: 'network-switch-8-port',
      description:
        'An eight-port network switch for connecting multiple wired devices within a local area network.',
      price: '39.99',
      stock: 20,
    },
    {
      name: 'Ethernet Cable 5m',
      slug: 'ethernet-cable-5m',
      description:
        'A 5-meter Ethernet cable for wired network connections between compatible routers, switches, and computers.',
      price: '8.99',
      stock: 55,
    },
    {
      name: '1080p Projector',
      slug: '1080p-projector',
      description:
        'A Full HD projector for presentations, movies, and home entertainment with compatible devices.',
      price: '299.99',
      stock: 4,
    },
    {
      name: 'Laser Printer',
      slug: 'laser-printer',
      description:
        'A laser printer for producing clear text documents and everyday office paperwork.',
      price: '179.99',
      stock: 7,
    },
    {
      name: 'Wireless Printer',
      slug: 'wireless-printer',
      description:
        'A wireless printer for printing documents and images from compatible computers and devices.',
      price: '149.99',
      stock: 8,
    },
    {
      name: 'Drawing Tablet',
      slug: 'drawing-tablet',
      description:
        'A digital drawing tablet for illustration, graphic design, handwriting, and creative computer work.',
      price: '89.99',
      stock: 10,
    },
    {
      name: 'Graphics Tablet Pen',
      slug: 'graphics-tablet-pen',
      description:
        'A replacement pen for compatible graphics tablets used for drawing, sketching, and digital design.',
      price: '24.99',
      stock: 18,
    },
    {
      name: 'External DVD Drive',
      slug: 'external-dvd-drive',
      description:
        'An external DVD drive for reading compatible optical discs through a computer connection.',
      price: '32.99',
      stock: 12,
    },
    {
      name: 'Card Reader USB-C',
      slug: 'card-reader-usb-c',
      description:
        'A USB-C card reader for transferring files from compatible memory cards to supported devices.',
      price: '16.99',
      stock: 27,
    },
    {
      name: 'SD Card 128GB',
      slug: 'sd-card-128gb',
      description:
        'A 128GB SD memory card for storing photos, videos, and files on compatible devices.',
      price: '22.99',
      stock: 33,
    },
    {
      name: 'MicroSD Card 256GB',
      slug: 'microsd-card-256gb',
      description:
        'A 256GB microSD memory card for expanding storage on compatible cameras and electronic devices.',
      price: '34.99',
      stock: 26,
    },
    {
      name: 'Action Camera',
      slug: 'action-camera',
      description:
        'A compact action camera for recording outdoor activities, travel, and everyday adventures.',
      price: '189.99',
      stock: 6,
    },
    {
      name: 'Mirrorless Camera',
      slug: 'mirrorless-camera',
      description:
        'A mirrorless camera for photography and video creation with compatible lenses and accessories.',
      price: '699.99',
      stock: 3,
    },
    {
      name: 'Camera Tripod',
      slug: 'camera-tripod',
      description:
        'A camera tripod that provides stable support for photography, video recording, and time-lapse shots.',
      price: '39.99',
      stock: 14,
    },
    {
      name: 'Ring Light',
      slug: 'ring-light',
      description:
        'A ring light for improving lighting during video calls, livestreams, portraits, and content creation.',
      price: '29.99',
      stock: 23,
    },
    {
      name: 'LED Desk Lamp',
      slug: 'led-desk-lamp',
      description:
        'An LED desk lamp for illuminating a desk during reading, studying, and computer work.',
      price: '25.99',
      stock: 19,
    },
    {
      name: 'Smart LED Bulb',
      slug: 'smart-led-bulb',
      description:
        'A smart LED bulb for compatible lighting systems with app-based control and supported smart features.',
      price: '15.99',
      stock: 40,
    },
    {
      name: 'Smart Plug',
      slug: 'smart-plug',
      description:
        'A smart plug for controlling compatible electrical devices through supported connected-home features.',
      price: '18.99',
      stock: 31,
    },
    {
      name: 'Security Camera',
      slug: 'security-camera',
      description:
        'A security camera for monitoring a home or office with features supported by the selected model.',
      price: '79.99',
      stock: 9,
    },
    {
      name: 'Video Doorbell',
      slug: 'video-doorbell',
      description:
        'A video doorbell for viewing visitors and using supported notification features at your entrance.',
      price: '99.99',
      stock: 7,
    },
    {
      name: 'UPS Battery Backup',
      slug: 'ups-battery-backup',
      description:
        'A UPS battery backup that provides temporary power for compatible electronics during power interruptions.',
      price: '139.99',
      stock: 5,
    },
    {
      name: 'Surge Protector',
      slug: 'surge-protector',
      description:
        'A surge protector with multiple outlets for connecting compatible electronic equipment.',
      price: '24.99',
      stock: 22,
    },
    {
      name: 'Gaming Controller',
      slug: 'gaming-controller',
      description:
        'A game controller for playing supported games on compatible computers and gaming devices.',
      price: '64.99',
      stock: 16,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        ...product,
        categoryId: category.id,
        status: 'ACTIVE',
      },
      create: {
        ...product,
        categoryId: category.id,
        status: 'ACTIVE',
      },
    });
  }

  console.log(`✅ ${products.length} products seeded successfully`);
}
