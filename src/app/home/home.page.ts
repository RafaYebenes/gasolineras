import { Component } from '@angular/core';
import { GasService } from '../services/gas.service';
import { Geolocation } from '@capacitor/geolocation';
import * as Leaflet from 'leaflet';
import { antPath } from 'leaflet-ant-path';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})


export class HomePage {

  map: Leaflet.Map;
  constructor(private gas: GasService) {}
  load = false;
  coords 
  gasList;

  async ngOnInit() {

    this.coords = await (await Geolocation.getCurrentPosition()).coords;
    console.log('coords', this.coords)
    this.leafletMap();

    this.gas.getGasData().subscribe((res: any) => {

      this.gasList = res.ListaEESSPrecio;
      console.log('test', parseFloat(this.gasList[0].Latitud.replace(',', '.')))
      console.log('test', parseFloat(this.gasList[0]['Longitud (WGS84)'].replace(',', '.')))
      
    });
  
  }

  leafletMap() {
    console.log('lang', this.coords.latitude)
    console.log('long', this.coords.longitude)

    this.map = Leaflet.map('mapId', {
      center: [this.coords.latitude, this.coords.longitude],
      zoom: 10
    })
    
    Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'yebenesApps',
    }).addTo(this.map);

    this.map.whenReady(() => {
      setTimeout(() => {
        this.map.invalidateSize();
        this.load = true;
      }, 1000);
    });


    /*this.gasList.forEach((station, index) => {
      Leaflet.marker([parseFloat(station.Latitud), parseFloat(station['Longitud (WGS84)'])]).addTo(this.map).bindPopup(station['Rótulo']).openPopup();
      if(index == 50) return;
    });*/
    
  }

}
