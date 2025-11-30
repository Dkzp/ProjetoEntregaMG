import bcrypt from "bcrypt"

const hashedPassword = await bcrypt.hash("123456", 10);
console.log(hashedPassword)