'use strict';
import { createAction, createSlice } from "@reduxjs/toolkit"

type UpdateOptionPayload<TOptionType = unknown> = { name: string } & CommandOption<TOptionType>;

const updateOption = createAction<UpdateOptionPayload, 'updateOption'>('updateOption');
const deleteOption = createAction<string, 'deleteOption'>('deleteOption');
const updateAppName = createAction<string, 'updateAppName'>('updateAppName');
const updateDescription = createAction<string, 'updateDescription'>('updateDescription');

interface AppState {
  appName: string,
  description?: string,
  options: Record<string, CommandOption<unknown>>,
}

interface CommandOption<TDataType, TInputType = string | null | undefined> {
  name: string,
  transform?: ((input: TInputType) => TDataType),
  validate: (input: TInputType) => boolean,
  default: TDataType,
  keys?: string | string[],
  environmentKeys?: string | string[],
  argumentNames?: string | string[],
  required?: boolean,
}


// const initialState: AppState = {
//   appName: 'my-cli-app',
//   description: 'CLI & Environment based configuration loader.',
//   options: {
//     port: <CommandOption<number, any>>{
//       description: 'Port to run the server on.',
//       transform: parseInt,
//       validate: (input: string) => !isNaN(parseInt(input)),
//       default: 3000,
//       envLookup: 'PORT',
//       flag: ['--port', '-p'],
//     }
//   }
// };

// export const appSlice = createSlice({
//   name: 'users',
//   initialState,
//   reducers: { },
//   extraReducers: (builder) => {
//     builder
//       .addCase(updateAppName, (state, action) => {
//         state.appName = action.payload;
//       })
//       .addCase(updateDescription, (state, action) => {
//         state.description = action.payload;
//       })
//       .addCase(updateOption, (state, action) => {
//         state.options[action.payload.name] = action.payload;
//       })
//       .addCase(deleteOption, (state, action) => {
//         delete state.options[action.payload];
//       });
//   },
// })




// const fetchUserById = createAsyncThunk(
//   'users/fetchById',
//   // if you type your function argument here
//   async (userId: number) => {
//     const response = await fetch(`https://reqres.in/api/users/${userId}`)
//     return (await response.json()) as Returned
//   }
// )