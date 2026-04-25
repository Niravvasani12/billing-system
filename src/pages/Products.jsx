import { useDispatch, useSelector } from "react-redux";
import ProductForm from "../components/ProductForm";
import { addProduct, fetchProducts } from "../store/slices/productSlice";

export default function Products() {
  const dispatch = useDispatch();
  const products = useSelector((state) => state.product.items);

  const handleAdd = async (payload) => {
    await dispatch(addProduct(payload));
    dispatch(fetchProducts());
  };

  return (
    <section className="stack">
      <div className="panel"><h3>Add Product</h3><ProductForm onSubmit={handleAdd} /></div>
      <div className="panel">
        <h3>Product List</h3>
        {products.map((p) => (
          <div className="list-row" key={p.id}><strong>{p.name}</strong><span>{p.sku || "-"}</span><span>{p.pricePerMeter}/meter</span></div>
        ))}
      </div>
    </section>
  );
}
