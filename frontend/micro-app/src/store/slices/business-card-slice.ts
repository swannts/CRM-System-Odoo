import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { businessCardService } from 'src/services/business-card-service';
import { RootState } from '../index';

interface BusinessCardState {
  card: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  saveLoading: boolean;
}

const initialState: BusinessCardState = {
  card: {
    data: null,
    loading: false,
    error: null,
  },
  saveLoading: false,
};

export const fetchBusinessCard = createAsyncThunk('businessCard/fetchCard', async (_, { rejectWithValue }) => {
  try {
    return await businessCardService.getCard();
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch business card');
  }
});

export const saveBusinessCardThunk = createAsyncThunk(
  'businessCard/saveCard',
  async ({ id, data }: { id?: string; data: any }, { dispatch, rejectWithValue }) => {
    try {
      if (id) {
        await businessCardService.updateCard(id, { fields: data });
      } else {
        await businessCardService.createCard({ fields: data, cardName: 'My Business Card' });
      }
      dispatch(fetchBusinessCard());
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save business card');
    }
  }
);

const businessCardSlice = createSlice({
  name: 'businessCard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBusinessCard.pending, (state) => {
        state.card.loading = true;
      })
      .addCase(fetchBusinessCard.fulfilled, (state, action) => {
        state.card.data = action.payload;
        state.card.loading = false;
      })
      .addCase(fetchBusinessCard.rejected, (state, action) => {
        state.card.loading = false;
        state.card.error = action.payload as string;
      })
      .addCase(saveBusinessCardThunk.pending, (state) => {
        state.saveLoading = true;
      })
      .addCase(saveBusinessCardThunk.fulfilled, (state) => {
        state.saveLoading = false;
      })
      .addCase(saveBusinessCardThunk.rejected, (state) => {
        state.saveLoading = false;
      });
  },
});

export default businessCardSlice.reducer;

export const selectBusinessCard = (state: RootState) => state.businessCard;
