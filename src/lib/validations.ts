import { z } from "zod/v4";

export const orderStageEnum = z.enum([
  "INGRESO",
  "PREPARACION",
  "PINTURA",
  "DETAIL_ENTREGA",
]);

export const workOrderStatusEnum = z.enum(["PROCESO", "LISTO", "ENTREGADO"]);

export const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const createCustomerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.email("Email inválido"),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const vehicleSchema = z.object({
  customerId: z.string().min(1, "Cliente requerido"),
  licensePlate: z.string().min(1, "Patente requerida"),
  brand: z.string().min(1, "Marca requerida"),
  model: z.string().min(1, "Modelo requerido"),
  year: z.number().int().min(1900).max(2100).optional(),
  color: z.string().optional(),
  vin: z.string().optional(),
  notes: z.string().optional(),
});

export const updateVehicleSchema = vehicleSchema.partial().omit({
  customerId: true,
});

export const workOrderSchema = z.object({
  vehicleId: z.string().min(1, "Vehículo requerido"),
  title: z.string().min(1, "Título requerido"),
  description: z.string().optional(),
  // IDs de los servicios elegidos: alimentan la concatenación del flujo inicial
  serviceIds: z.array(z.string()).min(1, "Seleccioná al menos un servicio"),
  internalNotes: z.string().optional(),
  estimatedDeliveryDate: z.coerce.date().optional(),
  budgetAmount: z.number().positive().optional(),
});

export const statusUpdateSchema = z.object({
  workOrderId: z.string().min(1),
  title: z.string().min(1, "Título requerido"),
  description: z.string().optional(),
  internalDescription: z.string().optional(),
  stage: orderStageEnum.optional(),
  visibleToCustomer: z.boolean().default(true),
  notifyCustomer: z.boolean().default(false),
  // por defecto true: los estados creados a mano son intercalados (no vienen del flujo)
  custom: z.boolean().default(true),
  photoIds: z.array(z.string()).optional(),
});

// Editor de flujo: paso plantilla de un servicio
export const flowStepSchema = z.object({
  title: z.string().min(1, "Título requerido"),
  description: z.string().optional(),
  stage: orderStageEnum,
  visible: z.boolean().default(true),
  custom: z.boolean().default(false),
  sortOrder: z.number().int().min(0).optional(),
});

export const tutorialSchema = z.object({
  title: z.string().min(1, "Título requerido"),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido"),
  description: z.string().optional(),
  content: z.string().min(1, "Contenido requerido"),
  videoUrl: z.url().optional().or(z.literal("")),
  category: z.string().min(1, "Categoría requerida"),
  visible: z.boolean().default(true),
});

export const serviceSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  visible: z.boolean().default(true),
  // sortOrder se autocalcula al crear; opcional para edición manual
  sortOrder: z.number().int().min(0).optional(),
});

// Payload de reordenamiento drag & drop (servicios o pasos de flujo)
export const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1, "Lista vacía"),
});

export const activateAccountSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

// Formulario público de contacto (no hay endpoint real; el envío queda como TODO)
export const contactSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  email: z.email("Email inválido"),
  tel: z.string().optional(),
  servicio: z.string().min(1, "Elegí un servicio"),
  msg: z.string().optional(),
});
