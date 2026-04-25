class Customer {
  constructor({ id, name, phone, email, address, createdAt }) {
    this.id = id;
    this.name = name;
    this.phone = phone;
    this.email = email;
    this.address = address;
    this.createdAt = createdAt;
  }
}

module.exports = Customer;
