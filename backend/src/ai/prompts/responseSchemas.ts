// Formatos de respuesta (JSON Schema) que se le exigen al modelo en cada operación.
export type JsonSchema = {
  type: 'object' | 'string' | 'array' | 'integer' | 'number' | 'boolean';
  description?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: readonly string[];
};

export const responseSchemas = {
  d2: {
    type: 'object',
    properties: {
      phenomenon_description: { type: 'string' },
      fiveW2H: {
        type: 'object',
        properties: {
          what: { type: 'string' },
          who: { type: 'string' },
          where: { type: 'string' },
          when: { type: 'string' },
          how: { type: 'string' },
          how_many: { type: 'string' },
          why_is_it_a_problem: { type: 'string' },
          affected_clauses: { type: 'string' },
        },
        required: ["what", "who", "where", "when", "how", "how_many", "why_is_it_a_problem", "affected_clauses"]
      },
    },
    required: ["phenomenon_description", "fiveW2H"]
  },
  costs: {
    type: 'object',
    properties: {
      total_loss_estimate: { type: 'string' },
      cost_breakdown: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            impact_description: { type: 'string' },
            estimated_value: { type: 'string' },
          },
          required: ["category", "impact_description", "estimated_value"]
        },
      },
    },
    required: ["total_loss_estimate", "cost_breakdown"]
  },
  d3: {
    type: 'object',
    properties: {
      actions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            action: { type: 'string' },
            responsible: { type: 'string' },
            implementationDate: { type: 'string' },
          },
          required: ["action", "responsible", "implementationDate"]
        }
      }
    },
    required: ["actions"]
  },
  d4Ishikawa: {
    type: 'object',
    properties: {
      hypotheses: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            text: { type: 'string' },
          },
          required: ["category", "text"]
        },
      },
    },
    required: ["hypotheses"]
  },
  d4Gemba: {
    type: 'object',
    properties: {
      diagnostics: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            hypothesisId: { type: 'string' },
            cause: { type: 'string' },
            questions: { type: 'array', items: { type: 'string' } },
          },
          required: ["hypothesisId", "cause", "questions"]
        },
      },
    },
    required: ["diagnostics"]
  },
  d4CombinedCause: {
    type: 'object',
    properties: {
      synthetic_cause: { type: 'string' },
    },
    required: ["synthetic_cause"]
  },
  d4Secondary: {
    type: 'object',
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            hypothesisId: { type: 'string' },
            cause: { type: 'string' },
            actions: { type: 'array', items: { type: 'string' } },
          },
          required: ["hypothesisId", "cause", "actions"]
        },
      },
    },
    required: ["results"]
  },
  d4Whys: {
    type: 'object',
    properties: {
      whys: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            step: { type: 'string' },
            answer: { type: 'string' },
          },
          required: ["step", "answer"]
        },
      },
      causa_raiz_sistemica: { type: 'string' },
    },
    required: ["whys", "causa_raiz_sistemica"]
  },
  acpPlan: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      introduction: { type: 'string' },
      actions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            action: { type: 'string' },
            responsible: { type: 'string' },
            timeframe: { type: 'string' },
          },
          required: ["action", "responsible", "timeframe"]
        },
      },
    },
    required: ["title", "introduction", "actions"]
  },
  d5Poka: {
    type: 'object',
    properties: {
      solutions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            level: { type: 'string', description: "Básico o Avanzado / Basic or Advanced" },
            description: { type: 'string' },
            benefit: { type: 'string' },
            sources: { type: 'string' },
          },
          required: ["type", "level", "description", "benefit", "sources"]
        },
      },
    },
    required: ["solutions"]
  },
  d5A3: {
    type: 'object',
    properties: {
      generationDate: { type: 'string' },
      responsible: { type: 'string' },
      phenomenon: { type: 'string' },
      rootCauses: { type: 'string' },
      financialJustification: { type: 'string' },
      risks: { type: 'string' },
      actions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            action: { type: 'string' },
            actionId: { type: 'string' },
            responsible: { type: 'string' },
            timeframe: { type: 'string' },
            type: { type: 'string' },
          },
          required: ["action", "actionId", "responsible", "timeframe", "type"]
        },
      },
      standardization: { type: 'string' },
      efficacySteps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            actionId: { type: 'string' },
            action: { type: 'string' },
            method: { type: 'string' },
            responsible: { type: 'string' },
            date: { type: 'string' },
            isEffective: { type: 'string' },
          },
          required: ["actionId", "action", "method", "responsible", "date", "isEffective"]
        }
      },
    },
    required: ["generationDate", "responsible", "phenomenon", "rootCauses", "financialJustification", "risks", "actions", "standardization", "efficacySteps"]
  },
  d7Quiz: {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question_text: { type: 'string' },
            options: { type: 'array', items: { type: 'string' } },
            correct_answer: { type: 'integer' },
          },
          required: ["question_text", "options", "correct_answer"]
        },
      },
    },
    required: ["questions"]
  },
  efficacyValidation: {
    type: 'object',
    properties: {
      protocols: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            action: { type: 'string' },
            verificationMethod: { type: 'string' },
            kpi: { type: 'string' },
            auditFrequency: { type: 'string' },
            contingencyPlan: { type: 'string' },
            executionResponsible: { type: 'string' },
            executionDate: { type: 'string' },
            verificationResponsible: { type: 'string' },
            verificationDate: { type: 'string' },
            isEffective: { type: 'string' },
          },
          required: ["id", "action", "verificationMethod", "kpi", "auditFrequency", "contingencyPlan", "executionResponsible", "executionDate", "verificationResponsible", "verificationDate", "isEffective"]
        },
      },
    },
    required: ["protocols"]
  },
} satisfies Record<string, JsonSchema>;

export type ResponseSchemaKey = keyof typeof responseSchemas;
