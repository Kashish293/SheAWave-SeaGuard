// Request validation middleware using Joi
const Joi = require('joi');
const { AppError } = require('./errorHandler');

// Validation schemas
const schemas = {
    // Net registration schema
    registerNet: Joi.object({
        netId: Joi.string().required(),
        qrCodeId: Joi.string().required(),
        ownerId: Joi.string().required(),
        deploymentLocation: Joi.object({
            latitude: Joi.number().min(-90).max(90).required(),
            longitude: Joi.number().min(-180).max(180).required(),
        }).required(),
        deploymentTime: Joi.date().iso().optional(),
    }),

    // GPS data ingestion schema
    gpsData: Joi.object({
        netId: Joi.string().required(),
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
        timestamp: Joi.date().iso().optional(),
        source: Joi.string().valid('lora', 'gsm', 'satellite').optional(),
    }),

    // Batch GPS data schema
    batchGpsData: Joi.array().items(
        Joi.object({
            netId: Joi.string().required(),
            latitude: Joi.number().min(-90).max(90).required(),
            longitude: Joi.number().min(-180).max(180).required(),
            timestamp: Joi.date().iso().optional(),
            source: Joi.string().valid('lora', 'gsm', 'satellite').optional(),
        })
    ).min(1).max(100),

    // Update net schema
    updateNet: Joi.object({
        ownerId: Joi.string().optional(),
        status: Joi.string().valid('active', 'ghost_suspected', 'ghost_confirmed', 'recovered').optional(),
    }).min(1),

    // Recovery confirmation schema
    recoveryConfirm: Joi.object({
        recoveredBy: Joi.string().optional(),
        recoveryNotes: Joi.string().optional(),
    }),
};

// Validation middleware factory
const validate = (schemaName) => {
    return (req, res, next) => {
        const schema = schemas[schemaName];

        if (!schema) {
            return next(new AppError('Validation schema not found', 500));
        }

        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            return next(new AppError(errorMessage, 400));
        }

        req.validatedBody = value;
        next();
    };
};

module.exports = {
    validate,
    schemas,
};
