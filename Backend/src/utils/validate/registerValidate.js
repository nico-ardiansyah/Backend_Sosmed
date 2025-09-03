const joi = require('joi');

const registerSchema = joi.object({
    username: joi.string()
        .trim()
        .required()
        .pattern(/^\S+$/)
        .messages({
            'string.empty': 'username is required',
            'any.required': 'username is required',
            'string.pattern.base': 'username must not contain spaces'
        }),
    
    email: joi.string()
        .trim()
        .lowercase()
        .required()
        .email()
        .messages({
            'string.empty': 'email is required',
            'any.required': 'email is required',
            'string.email': 'format email is not valid'
        }),
    
    password: joi.string()
        .trim()
        .required()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/)
        .messages({
            'string.empty': 'password is required',
            'any.required': 'password is required',
            'string.min': 'password must min 8 characters',
            'string.pattern.base': 'password must contain uppercase, lowercase letters and numbers'
        }),
    
    confirmPassword: joi.string()
        .trim()
        .required()
        .valid(joi.ref('password'))
        .messages({
            'any.only': 'confirm password not match with password',
            'string.empty': 'confirm password is required',
            'any.required' : 'confirm password is required'
        }),
    
});


module.exports = registerSchema;