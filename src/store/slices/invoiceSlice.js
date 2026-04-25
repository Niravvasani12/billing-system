import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createInvoice, listInvoices } from "../../services/invoiceService";

export const fetchInvoices = createAsyncThunk("invoice/fetchAll", async () => listInvoices());
export const addInvoice = createAsyncThunk("invoice/add", async (payload) => createInvoice(payload));

const invoiceSlice = createSlice({
  name: "invoice",
  initialState: { items: [], status: "idle" },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.items = action.payload || [];
      })
      .addCase(addInvoice.fulfilled, (state, action) => {
        if (action.payload) {
          state.items.unshift(action.payload);
        }
      });
  }
});

export default invoiceSlice.reducer;
