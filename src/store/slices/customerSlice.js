import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createCustomer, listCustomers } from "../../services/customerService";

export const fetchCustomers = createAsyncThunk("customer/fetchAll", async (userId) => listCustomers(userId));
export const addCustomer = createAsyncThunk("customer/add", async ({ payload, userId }) => createCustomer(payload, userId));

const customerSlice = createSlice({
  name: "customer",
  initialState: { items: [] },
  reducers: {
    clearCustomers: (state) => {
      state.items = [];
    }
  },
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

export const { clearCustomers } = customerSlice.actions;
export default customerSlice.reducer;
