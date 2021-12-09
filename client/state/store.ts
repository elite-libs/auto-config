import { configureStore } from '@reduxjs/toolkit'
import { useDispatch } from 'react-redux'
import { appSlice } from './appSlice'

const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
})

export type AppDispatch = typeof store.dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>() // Export a hook that can be reused to resolve types
export type RootState = ReturnType<typeof store.getState>

export default store;
store.dispatch(appSlice.actions.)