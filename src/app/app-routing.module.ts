import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { redirectUnauthorizedTo, canActivate, redirectLoggedInTo } from '@angular/fire/auth-guard'; // add this line

import { LoginComponent } from './pages/login/login.component';
import { ChatComponent } from './pages/chat/chat.component';

const redirectUnauthorizedToLogin = redirectUnauthorizedTo(['/login']); // add this line
const redirectLoggedInToChat = redirectLoggedInTo(['chat']); // add this line

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    ...canActivate(redirectLoggedInToChat) // add this line
  },
  {
    path: 'chat',
    component: ChatComponent,
    ...canActivate(redirectUnauthorizedToLogin) // add this line
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
