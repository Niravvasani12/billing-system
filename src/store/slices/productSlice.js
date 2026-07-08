import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createProduct, listProducts } from "../../services/productService";

export const fetchProducts = createAsyncThunk("product/fetchAll", async (userId) => listProducts(userId));
export const addProduct = createAsyncThunk("product/add", async ({ payload, userId }) => createProduct(payload, userId));

const productSlice = createSlice({
  name: "product",
  initialState: { items: [] },
  reducers: {
    clearProducts: (state) => {
      state.items = [];
    }
  },
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

export const { clearProducts } = productSlice.actions;
export default productSlice.reducer;
