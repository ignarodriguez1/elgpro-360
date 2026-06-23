import { PrismaClient } from "../src/generated/prisma/client";
import type { OrderStage } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { seedPortfolio } from "./portfolio-data";
import { buildDatabaseUrl } from "../src/lib/db-url";

const adapter = new PrismaPg(buildDatabaseUrl());
const prisma = new PrismaClient({ adapter });

type FlowDef = {
  title: string;
  description?: string;
  stage: OrderStage;
  visible: boolean;
};

// Cada servicio arranca con "Vehículo ingresado" (INGRESO) — el paso que se
// deduplica al concatenar flujos de varios servicios en una orden.
const serviceDefs: {
  name: string;
  description: string;
  flow: FlowDef[];
}[] = [
  {
    name: "Pintura completa",
    description:
      "Repintado integral del vehículo: desarme, preparación de superficies, aplicación de color y barniz, y armado final.",
    flow: [
      { title: "Vehículo ingresado", stage: "INGRESO", visible: true },
      { title: "Desarme y enmascarado", stage: "PREPARACION", visible: true },
      { title: "Masillado y lijado", stage: "PREPARACION", visible: true },
      { title: "Imprimación", stage: "PREPARACION", visible: true },
      { title: "Color aplicado", stage: "PINTURA", visible: true },
      { title: "Barniz", stage: "PINTURA", visible: true },
      { title: "Armado final", stage: "DETAIL_ENTREGA", visible: true },
    ],
  },
  {
    name: "Pintura parcial",
    description: "Repintado de paneles o zonas puntuales del vehículo.",
    flow: [
      { title: "Vehículo ingresado", stage: "INGRESO", visible: true },
      { title: "Preparación de zona", stage: "PREPARACION", visible: true },
      { title: "Color aplicado", stage: "PINTURA", visible: true },
      { title: "Barniz y armado", stage: "DETAIL_ENTREGA", visible: true },
    ],
  },
  {
    name: "Chapería",
    description: "Reparación de chapa: abolladuras, daños estructurales y enderezado.",
    flow: [
      { title: "Vehículo ingresado", stage: "INGRESO", visible: true },
      { title: "Diagnóstico de daño", stage: "PREPARACION", visible: true },
      { title: "Reparación de chapa", stage: "PREPARACION", visible: true },
      { title: "Preparación para pintura", stage: "PREPARACION", visible: true },
    ],
  },
  {
    name: "Ceramic Coating",
    description:
      "Recubrimiento cerámico de protección con efecto hidrofóbico y brillo intenso.",
    flow: [
      { title: "Vehículo ingresado", stage: "INGRESO", visible: true },
      {
        title: "Descontaminación",
        description: "Lavado técnico y descontaminación química de la pintura.",
        stage: "PREPARACION",
        visible: false,
      },
      { title: "Ceramic aplicado", stage: "DETAIL_ENTREGA", visible: true },
      { title: "Curado y control", stage: "DETAIL_ENTREGA", visible: true },
    ],
  },
  {
    name: "Pulido y corrección",
    description:
      "Corrección de pintura en múltiples etapas para eliminar marcas y restaurar el brillo.",
    flow: [
      { title: "Vehículo ingresado", stage: "INGRESO", visible: true },
      {
        title: "Lavado técnico",
        stage: "PREPARACION",
        visible: false,
      },
      { title: "Corrección multietapa", stage: "DETAIL_ENTREGA", visible: true },
      { title: "Sellado", stage: "DETAIL_ENTREGA", visible: true },
    ],
  },
  {
    name: "PPF (Paint Protection Film)",
    description: "Instalación de film de protección de pintura autorreparable.",
    flow: [
      { title: "Vehículo ingresado", stage: "INGRESO", visible: true },
      { title: "Preparación de superficie", stage: "PREPARACION", visible: true },
      { title: "Instalación de PPF", stage: "DETAIL_ENTREGA", visible: true },
      { title: "Control final", stage: "DETAIL_ENTREGA", visible: true },
    ],
  },
  {
    name: "Detail interior",
    description: "Limpieza y acondicionamiento profundo del habitáculo.",
    flow: [
      { title: "Vehículo ingresado", stage: "INGRESO", visible: true },
      { title: "Aspirado profundo", stage: "PREPARACION", visible: false },
      { title: "Limpieza y acondicionado", stage: "DETAIL_ENTREGA", visible: true },
    ],
  },
  {
    name: "Detail exterior",
    description: "Lavado técnico, sellado y realce de brillo de la carrocería.",
    flow: [
      { title: "Vehículo ingresado", stage: "INGRESO", visible: true },
      { title: "Lavado técnico", stage: "PREPARACION", visible: false },
      { title: "Sellado y brillo", stage: "DETAIL_ENTREGA", visible: true },
    ],
  },
  {
    name: "Restauración",
    description: "Restauración integral de vehículos clásicos o muy deteriorados.",
    flow: [
      { title: "Vehículo ingresado", stage: "INGRESO", visible: true },
      { title: "Evaluación", stage: "PREPARACION", visible: true },
      { title: "Restauración", stage: "PINTURA", visible: true },
      { title: "Terminación", stage: "DETAIL_ENTREGA", visible: true },
    ],
  },
  {
    name: "Personalizado",
    description: "Trabajo a medida: el taller arma el flujo según el caso.",
    flow: [{ title: "Vehículo ingresado", stage: "INGRESO", visible: true }],
  },
];

// Concatena flujos deduplicando el paso de ingreso (réplica de buildInitialTimeline).
function concatFlows(flows: FlowDef[][]): FlowDef[] {
  const result: FlowDef[] = [];
  let ingresoAdded = false;
  for (const flow of flows) {
    for (const step of flow) {
      if (step.stage === "INGRESO") {
        if (ingresoAdded) continue;
        ingresoAdded = true;
      }
      result.push(step);
    }
  }
  return result;
}

// Materializa una secuencia de pasos como statusUpdates de una orden.
function materialize(steps: FlowDef[], currentIndex: number, adminId: string) {
  return steps.map((s, i) => ({
    title: s.title,
    description: s.description ?? null,
    stage: s.stage,
    visibleToCustomer: s.visible,
    custom: false,
    sortOrder: i,
    isCurrent: i === currentIndex,
    confirmed: i <= currentIndex,
    createdByUserId: adminId,
  }));
}

async function main() {
  console.log("🌱 Seeding database...");

  const adminPassword = await hash("admin1234", 12);
  const customerPassword = await hash("cliente1234", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Admin ELG Pro",
      email: "admin@elgpro.com",
      passwordHash: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: "Martín López",
      email: "martin@example.com",
      passwordHash: customerPassword,
      role: "CUSTOMER",
      emailVerified: new Date(),
      customerProfile: {
        create: {
          phone: "+54 341 555-1234",
          notes: "Cliente frecuente, preferencia por ceramic coating",
        },
      },
    },
    include: { customerProfile: true },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: "Lucía Fernández",
      email: "lucia@example.com",
      passwordHash: customerPassword,
      role: "CUSTOMER",
      emailVerified: new Date(),
      customerProfile: { create: { phone: "+54 341 555-5678" } },
    },
    include: { customerProfile: true },
  });

  const vehicle1 = await prisma.vehicle.create({
    data: {
      customerId: customer1.customerProfile!.id,
      licensePlate: "AB 123 CD",
      brand: "BMW",
      model: "M4 Competition",
      year: 2023,
      color: "Negro Sapphire",
      notes: "PPF completo instalado en 2023",
    },
  });

  await prisma.vehicle.create({
    data: {
      customerId: customer1.customerProfile!.id,
      licensePlate: "EF 456 GH",
      brand: "Porsche",
      model: "911 Carrera S",
      year: 2022,
      color: "Blanco",
    },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      customerId: customer2.customerProfile!.id,
      licensePlate: "IJ 789 KL",
      brand: "Mercedes-Benz",
      model: "C 300 AMG Line",
      year: 2024,
      color: "Gris Selenita",
    },
  });

  // --- Servicios con sus flujos precargados ---
  const flowByService = new Map<string, FlowDef[]>();
  for (const [i, def] of serviceDefs.entries()) {
    await prisma.service.create({
      data: {
        name: def.name,
        description: def.description,
        visible: true,
        sortOrder: i,
        flow: {
          create: def.flow.map((f, j) => ({
            title: f.title,
            description: f.description,
            stage: f.stage,
            visible: f.visible,
            custom: false,
            sortOrder: j,
          })),
        },
      },
    });
    flowByService.set(def.name, def.flow);
  }

  // --- Orden 1 (BMW): Pintura completa, en curso (etapa PINTURA) ---
  const order1Steps = flowByService.get("Pintura completa")!;
  const order1CurrentIndex = order1Steps.findIndex(
    (s) => s.title === "Color aplicado"
  );
  await prisma.workOrder.create({
    data: {
      orderCode: "OT-1042",
      vehicleId: vehicle1.id,
      title: "Pintura completa — BMW M4",
      description: "Repintado integral en Negro Sapphire.",
      servicesRequested: ["Pintura completa"],
      status: "PROCESO",
      stage: order1Steps[order1CurrentIndex].stage,
      budgetAmount: 1200000,
      paymentStatus: "PARTIAL",
      estimatedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      statusUpdates: {
        create: materialize(order1Steps, order1CurrentIndex, admin.id),
      },
    },
  });

  // --- Orden 2 (Mercedes): Ceramic + Pulido concatenados (dedupe de ingreso) ---
  const order2Steps = concatFlows([
    flowByService.get("Ceramic Coating")!,
    flowByService.get("Pulido y corrección")!,
  ]);
  const order2CurrentIndex = order2Steps.findIndex(
    (s) => s.title === "Ceramic aplicado"
  );
  await prisma.workOrder.create({
    data: {
      orderCode: "OT-1043",
      vehicleId: vehicle3.id,
      title: "Ceramic + Pulido — Mercedes C300",
      description: "Corrección de pintura seguida de ceramic coating.",
      servicesRequested: ["Ceramic Coating", "Pulido y corrección"],
      status: "PROCESO",
      stage: order2Steps[order2CurrentIndex].stage,
      budgetAmount: 680000,
      paymentStatus: "PENDING",
      estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      statusUpdates: {
        create: materialize(order2Steps, order2CurrentIndex, admin.id),
      },
    },
  });

  await prisma.tutorial.createMany({
    data: [
      {
        title: "Cómo lavar correctamente tu auto con ceramic coating",
        slug: "lavado-correcto-ceramic-coating",
        description:
          "Guía paso a paso para mantener tu ceramic coating en óptimas condiciones.",
        content:
          "El lavado correcto es fundamental para mantener las propiedades de tu ceramic coating...",
        category: "Mantenimiento",
        visible: true,
      },
      {
        title: "Qué es el PPF y por qué lo necesitás",
        slug: "que-es-ppf",
        description:
          "Todo lo que tenés que saber sobre la película de protección de pintura.",
        content:
          "El Paint Protection Film es una película transparente de poliuretano termoplástico...",
        category: "Educación",
        visible: true,
      },
      {
        title: "Cuidados después de un polarizado",
        slug: "cuidados-post-polarizado",
        description:
          "Qué hacer y qué NO hacer en los primeros días después de polarizar tu auto.",
        content:
          "Después de instalar las láminas de polarizado, es crucial seguir estas recomendaciones...",
        category: "Mantenimiento",
        visible: true,
      },
      {
        title: "Corrección de pintura: ¿cuándo es necesaria?",
        slug: "correccion-pintura-cuando",
        description:
          "Aprendé a identificar cuándo tu pintura necesita una corrección profesional.",
        content:
          "La corrección de pintura es un proceso que elimina imperfecciones de la capa de barniz...",
        category: "Educación",
        visible: true,
      },
    ],
  });

  await prisma.productRecommendation.createMany({
    data: [
      {
        name: "Gyeon Q2M Bathe+",
        description:
          "Shampoo con SiO2 ideal para mantenimiento de ceramic coating. pH neutro, alta lubricidad.",
      },
      {
        name: "Gyeon Q2M Cure",
        description:
          "Spray de mantenimiento con SiO2 para reforzar la hidrofobicidad del coating entre lavados.",
      },
      {
        name: "Microfibra Dual Weave",
        description:
          "Paño de microfibra de doble cara para secado sin marcas. 70x40cm, 600 GSM.",
      },
    ],
  });

  await seedPortfolio(prisma);

  console.log("✅ Seed completed successfully");
  console.log(`   Servicios: ${serviceDefs.length} con sus flujos`);
  console.log(`   Órdenes: OT-1042 (PROCESO/PINTURA), OT-1043 (PROCESO/DETAIL_ENTREGA)`);
  console.log(`   Admin: admin@elgpro.com / admin1234`);
  console.log(`   Cliente 1: martin@example.com / cliente1234`);
  console.log(`   Cliente 2: lucia@example.com / cliente1234`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
