import axios from 'axios';
import api from '../../services/api';
import {
  createAsyncThunk,
  createSlice
} from '@reduxjs/toolkit';
import { unshiftCartData } from '../wc-store';

// Асинхронное действие для получения сервисов
export const getServices = createAsyncThunk('email/getServices',
  async () => {
    try {
      const results = await api.get(`wp-json/custom/v1/products?category=service`);
      const data = results.data
      return data; 
    } catch (error) {
      console.log(error);
    }
  }
);

export const getEmail = createAsyncThunk('email/getEmail',
  async (_, {getState, dispatch}) => {
    try {
      const { selectedService } = getState().email;
      if (selectedService) {
        const results = await api.post(`wp-json/custom/v1/create-order`, {
          sku: selectedService,
        });    
        const data = results.data
        dispatch(unshiftCartData(data))
        return data; // Возвращаем все результаты      
      } else {
        return {status: 0, error: 'Не выбран сервис'}
      }
      
    } catch (error) {
      console.error('Ошибка:', error.response?.data || error.message);
    }
  }
);

// Асинхронное действие для получения данных о ценах для каждого id
export const getPriceCount = createAsyncThunk('email/getPriceCount',
  async (service) => {
    const results = await api.post(`wp-json/custom/v1/get-product-data`, {
      sku: service,
    });  
    const data = results.data
    return data; // Возвращаем все результаты
  }
);



const initialState = {
  email: '',
  mailCodes: null, // Новое поле для хранения кодов
  priceData: null,
  service: null,
  selectedService: null,
  error: ''
};

// Создание слайса
export const emailSlice = createSlice({
  name: 'email',
  initialState,
  reducers: {
    setSelectedService: (state, action) => {
      state.selectedService = action.payload
    },
    
  },
  extraReducers: (builder) => {
    builder.addCase(getEmail.pending, (state) => {
      state.email = '';
      state.mailCodes = null;
      state.error = '';
    });
    builder.addCase(getEmail.fulfilled, (state, action) => {
      const result = action.payload;
      if (result.status == 'success') {
        state.email = result.order_data.meta_data.mail;
        state.mailCodes = result;
      } else {
        let textRu = result.error == 'No mails yet' ? 'Нет доступных почт' : result.error == 'Insufficient balance' ? 'Недостаточно средств' : 'Выберите один из сервисов'
        state.error = textRu;
      }
    });
    builder.addCase(getPriceCount.pending, (state) => {
      state.priceData = true;
      state.error =''
    });
    builder.addCase(getPriceCount.fulfilled, (state, action) => {
      if (action.payload.status == 'success') {
        state.priceData = action.payload; // Сохраняем результаты getPriceCount
      } else {
        state.error ='Нет доступных почт'
      }
    });
    builder.addCase(getServices.fulfilled, (state, action) => {
      if (Array.isArray(action.payload)) {
        const data = action.payload
        .map((elem)=>(
          {
            id: elem.sku,
            name: elem.name,
            img: elem.image,
            price: elem.price,
          }
        ))
        state.service = data; // Сохраняем результаты getServices
      } else {
        state.error ='Нет доступных сервисов'
      }
    });
  }
});

export const {
  setSelectedService
} = emailSlice.actions

export default emailSlice.reducer;