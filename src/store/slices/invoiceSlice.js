import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createInvoice, listInvoices } from "../../services/invoiceService";

export const fetchInvoices = createAsyncThunk("invoice/fetchAll", async (userId) => listInvoices(userId));
export const addInvoice = createAsyncThunk("invoice/add", async ({ payload, userId }) => createInvoice(payload, userId));

const invoiceSlice = createSlice({
  name: "invoice",
  initialState: { items: [], status: "idle" },
  reducers: {
    clearInvoices: (state) => {
      state.items = [];
    }
  },
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

export const { clearInvoices } = invoiceSlice.actions;
export default invoiceSlice.reducer;
