from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    fullName: str
    email: EmailStr
    password: str
    company: str
    role: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
