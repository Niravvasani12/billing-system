import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createProduct, listProducts } from "../../services/productService";

export const fetchProducts = createAsyncThunk("product/fetchAll", async () => listProducts());
export const addProduct = createAsyncThunk("product/add", async (payload) => createProduct(payload));

const productSlice = createSlice({
  name: "product",
  initialState: { items: [] },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.items = action.payload || [];
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        if (action.payload) state.items.unshift(action.payload);
      });
  }
});

export default productSlice.reducer;
