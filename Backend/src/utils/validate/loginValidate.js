const joi = require('joi');


const loginSchema = joi.object({
    username: joi.string()
            .trim()
            .required()
            .pattern(/^\S+$/)
            .messages({
                'string.empty': 'username is required',
                'any.required': 'username is required',
                'string.pattern.base': 'username must not contain spaces'
            }),
    
    password: joi.string()
            .trim()
            .required()
            .min(8)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/)
            .messages({
                'string.empty': 'password is required',
                'any.required': 'password is required',
                'string.min': 'password must min 8 character',
                'string.pattern.base': 'password must contain uppercase, lowercase letters and numbers'
            }),
    
});

module.exports = loginSchema;