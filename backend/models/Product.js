class Product {
  constructor({ id, name, sku, pricePerMeter, createdAt }) {
    this.id = id;
    this.name = name;
    this.sku = sku;
    this.pricePerMeter = pricePerMeter;
    this.createdAt = createdAt;
  }
}

module.exports = Product;
