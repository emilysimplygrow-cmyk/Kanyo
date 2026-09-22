import cors from '@fastify/cors'
import Fastify from 'fastify'
import { z } from 'zod'

const app = Fastify({ logger: true })
await app.register(cors, { origin: process.env.WEB_ORIGIN?.split(',') ?? true })

const assessmentSchema = z.object({
  oil: z.enum(['dry', 'balanced', 'oily', 'very-oily']),
  comfort: z.enum(['comfortable', 'tight', 'very-tight', 'stings']),
  sensitivity: z.enum(['low', 'medium', 'high', 'current']),
  concerns: z.array(z.string()).min(1),
})

app.get('/health', async () => ({ status: 'ok', service: 'kanyo-api' }))

app.post('/v1/profile/preview', async (request, reply) => {
  const parsed = assessmentSchema.safeParse(request.body)
  if (!parsed.success) return reply.code(400).send({ error: 'Invalid assessment', details: parsed.error.flatten() })
  const a = parsed.data
  const reactive = a.comfort === 'stings' || a.sensitivity === 'high' || a.sensitivity === 'current'
  return {
    profile: {
      oiliness: a.oil === 'very-oily' ? 'high' : a.oil === 'oily' ? 'balanced-to-oily' : a.oil,
      hydration: ['tight', 'very-tight', 'stings'].includes(a.comfort) ? 'needs-support' : 'comfortable',
      sensitivity: reactive ? 'reactive' : a.sensitivity === 'medium' ? 'occasional' : 'low',
    },
    safety: { simplify_routine: reactive, medical_disclaimer: true },
    rule_set_version: '2026-09-22.1',
  }
})

await app.listen({ port: Number(process.env.PORT ?? 3001), host: '0.0.0.0' })

