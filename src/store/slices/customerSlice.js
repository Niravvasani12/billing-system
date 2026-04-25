import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createCustomer, listCustomers } from "../../services/customerService";

export const fetchCustomers = createAsyncThunk("customer/fetchAll", async () => listCustomers());
export const addCustomer = createAsyncThunk("customer/add", async (payload) => createCustomer(payload));

const customerSlice = createSlice({
  name: "customer",
  initialState: { items: [] },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.items = action.payload || [];
      })
      .addCase(addCustomer.fulfilled, (state, action) => {
        if (action.payload) state.items.unshift(action.payload);
      });
  }
});

export default customerSlice.reducer;
