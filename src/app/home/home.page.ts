import { Component, HostListener } from '@angular/core';
import { GasService } from '../services/gas.service';
import { Geolocation } from '@capacitor/geolocation';
import * as Leaflet from 'leaflet';
import { ToastController } from '@ionic/angular';

import {
  AdMob,
  BannerAdOptions,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
} from '@capacitor-community/admob';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  providers: [GasService],
})
export class HomePage {
  map: Leaflet.Map;
  constructor(private gas: GasService,private toastController: ToastController) {
    this.initialize()
  }

  load = false;
  loading = true;
  coords;
  gasList;
  coordsChanged;
  markers = [];
  higherPrice = 0;
  lowerPrice = 0;
  mediumPrice = 0;
  rango1 = 0;
  rango2 = 0;
  stationSelected;
  gasMasBarata;
  isModalOpen = false;
  showCheapers = false;
  labelSegment = 'all';
  showFilters = false;



  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  async initialize(){
    await AdMob.trackingAuthorizationStatus().then((res) => {
      if(res.status == "authorized") this.showBanner().catch(res => {
        this.showError('error on ad loading' + res)
      })
      else console.log('fallo al obtener la autorización')
    });
  }

  async ngOnInit() {
   

    console.log('dateStart home', new Date());

    await Geolocation.getCurrentPosition().then((res) => {
      this.coords = res.coords
    }).catch((res) => {
      this.showError('error getting coords' + res)
    });

    this.gas.getGasData().subscribe((res: any) => {
      this.gasList = this.getGasStations(res);
      this.loadStations(this.coords.latitude, this.coords.longitude);
      this.loading = false;
      console.log('dateEnd home', new Date());
    });

    this.isModalOpen = false;

    this.leafletMap();
  }

  getGasStations(list) {
    return list.ListaEESSPrecio.map((el, index) => {
      return {
        id: el.IDEESS,
        direccion: el['Dirección'],
        name: el['Rótulo'],
        provincia: el['Provincia'],
        lat: parseFloat(el.Latitud.replace(',', '.')),
        lng: parseFloat(el['Longitud (WGS84)'].replace(',', '.')),
        horario: el.Horario,
        biodiesel: el['Precio Biodiesel'],
        bioEtanol: el['Precio Bioetanol'],
        gasNaturalComp: el['Precio Gas Natural Comprimido'],
        gasNaturalLiq: el['Precio Gas Natural Licuado'],
        diesel: el['Precio Gasoleo A'],
        gasB: el['Precio Gasoleo B'],
        dieselPremium: el['Precio Gasoleo Premium'],
        gaso95: el['Precio Gasolina 95 E5'],
        gaso95Premium: el['Precio Gasolina 95 E5 Premium'],
        gaso95E10: el['Precio Gasolina 95 E10'],
        gaso98: el['Precio Gasolina 98 E5'],
        gaso98E10: el['Precio Gasolina 98 E10'],
        adBlue: el['Precio Hidrogeno'],
        tipoVenta: el['Tipo Venta'],
        link:
          'https://www.google.com/maps/dir/?api=1&destination=' +
          parseFloat(el.Latitud.replace(',', '.')) +
          '/' +
          parseFloat(el['Longitud (WGS84)'].replace(',', '.')),
      };
    });
  }

  goBack() {
    this.setOpen(false);
  }

  setPrices() {
    this.mediumPrice = parseFloat(
      ((this.higherPrice + this.lowerPrice) / 2).toFixed(5)
    );

    this.rango1 = this.mediumPrice + (this.higherPrice - this.mediumPrice) / 2;

    this.rango2 = this.lowerPrice + (this.mediumPrice - this.lowerPrice) / 2;
  }

  leafletMap() {
    this.map = Leaflet.map('mapId', {
      center: [this.coords.latitude, this.coords.longitude],
      zoom: 12,
      zoomControl: false,
    })

    Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'yebenesApps',
    }).addTo(this.map);

    this.map.whenReady(() => {
      setTimeout(() => {
        this.map.invalidateSize();
        this.load = true;
      }, 500);
    });

    this.map.on('dragend', (data) => {
      this.removeMarks();
      this.coordsChanged = data.target.getCenter();
      this.loadStations(this.coordsChanged.lat, this.coordsChanged.lng);
    });

  }

  getNearCoords(lat1, lat2, lon1, lon2, unit) {
    var radlat1 = (Math.PI * lat1) / 180;
    var radlat2 = (Math.PI * lat2) / 180;
    var theta = lon1 - lon2;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit == 'K') {
      dist = dist * 1.609344;
    }
    if (unit == 'N') {
      dist = dist * 0.8684;
    }

    return dist;
  }

  getNearStations(lat1, lng1) {
    this.gasMasBarata = null;
    let nearStations = this.gasList.filter((el) => {
      if (
        this.getNearCoords(lat1, el.lat, lng1, el.lng, 'K') < 5 &&
        el.tipoVenta == 'P'
      )
        return el;
    });

    nearStations.map((el, index) => {
      if (index == 0) {
        this.higherPrice = parseFloat(el.diesel.replace(',', '.'));
        this.lowerPrice = parseFloat(el.diesel.replace(',', '.'));
        this.gasMasBarata = el;
      }

      if (
        parseFloat(el.diesel.replace(',', '.')) > this.higherPrice &&
        el.diesel
      )
        this.higherPrice = parseFloat(el.diesel.replace(',', '.'));

      if (
        parseFloat(el.diesel.replace(',', '.')) < this.lowerPrice &&
        el.diesel
      ) {
        this.lowerPrice = parseFloat(el.diesel.replace(',', '.'));
        this.gasMasBarata = el;
      }
    });

    this.setPrices();

    if (this.showCheapers) {
      nearStations = nearStations.filter((el) => {
        let diesel = parseFloat(el.diesel.replace(',', '.'));

        if (this.mediumPrice > diesel && diesel >= this.lowerPrice) {
          return el;
        }
      });

      return nearStations;
    } else return nearStations;
  }

  loadStations(lat1, lng1) {
    this.getNearStations(lat1, lng1).forEach((el, index) => {
      let diesel = parseFloat(el.diesel.replace(',', '.'));

      var greenIcon = Leaflet.icon({
        iconUrl: this.getIcon(diesel),
        iconSize: [50, 50], // size of the icon
      });

      let mark = Leaflet.marker([el.lat, el.lng], {
        icon: greenIcon,
        title: index,
      })
        .addTo(this.map)
        .bindTooltip(el.diesel + '€', { permanent: true, direction: 'top' })
        .addEventListener('click', (station) => {
          console.log('gas', el);
          this.stationSelected = el;
          this.setOpen(true);
        });

      this.markers.push(mark);
    });
  }

  getIcon(diesel) {
    if (this.higherPrice >= diesel && diesel >= this.rango1) {
      return '../../assets/markers/pin-high.png';
    }

    if (this.rango1 > diesel && diesel >= this.mediumPrice) {
      return '../../assets/markers/pin-medium.png';
    }

    if (this.mediumPrice > diesel && diesel >= this.lowerPrice) {
      return '../../assets/markers/pin-low.png';
    }

    return '../../assets/markers/pin-medium.png';
  }

  openModalCheaper() {
    this.stationSelected = this.gasMasBarata;
    this.setOpen(true);
  }

  removeMarks() {
    this.markers.forEach((mark) => {
      this.map.removeLayer(mark);
    });
  }

  centerMap() {
    this.removeMarks();
    this.loadStations(this.coords.latitude, this.coords.longitude);
    this.map.flyTo([this.coords.latitude, this.coords.longitude]);
  }

  showAll() {
    this.labelSegment = 'all';
    this.showCheapers = false;
    this.removeMarks();
    this.loadStations(
      this.coordsChanged ? this.coordsChanged.lat : this.coords.latitude,
      this.coordsChanged ? this.coordsChanged.lng : this.coords.longitude
    );
  }

  showCheaper() {
    this.labelSegment = 'cheap';
    this.showCheapers = true;
    this.removeMarks();
    this.loadStations(
      this.coordsChanged ? this.coordsChanged.lat : this.coords.latitude,
      this.coordsChanged ? this.coordsChanged.lng : this.coords.longitude
    );
  }

  async showBanner() {

    AdMob.initialize({
      requestTrackingAuthorization: true,
    });

    const idAndroid = 'ca-app-pub-7253910914294252/4651282874';

    const options: BannerAdOptions = {
      adId: idAndroid,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.TOP_CENTER,
      margin: 0,
    };

    await AdMob.showBanner(options);
  }


  async showError(error) {
    const toast = await this.toastController.create({
      message: error,
      duration: 2000,
      position: 'bottom'
    });

    await toast.present();
  }

  toogleFilters(){
    this.showFilters = !this.showFilters
  }
}
