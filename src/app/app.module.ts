import { HttpClientModule} from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { GasService } from './services/gas.service';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule, LeafletModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, GasService],
  bootstrap: [AppComponent],
})
export class AppModule {}
