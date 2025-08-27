const joi = require('joi');


const newPasswordSchema = joi.object({
    
    password: joi.string()
        .trim()
        .required()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/)
        .messages({
            'string.empty': 'password is required',
            'any.required': 'password is required',
            'string.min': 'password must 8 characters',
            'string.pattern.base' : 'password must contain uppercase, lowercase letters and numbers'
        }),
    
    confirmPassword : joi.string()
        .trim()
        .required()
        .valid(joi.ref('password'))
        .messages({
            'string.empty': 'confirm password is required',
            'any.required': 'confirm password is required',
            'any.only' : 'confirm password not match with password'
        })
});

module.exports = newPasswordSchema;