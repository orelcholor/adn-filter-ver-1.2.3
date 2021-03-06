import { Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { FormControl, FormGroup} from '@angular/forms';
import { DataDbService } from 'src/app/services/data-db.service';

import{ Cadena } from '../../models/cadena';

@Component({
  selector: 'formulario-adn',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css'],
  providers:[DataDbService]
})

export class ItemsComponent implements OnInit {
  /***Formlario */   
  public adnForm: FormGroup;//formulario

  /***GET */
  public cadenasGet: any;//respuesta con datos de la API
  public cadenasGetAdn: Array<string>;//cadena de ADN de la API

  /***POST */
  public cadenasPost: Cadena;//obj cadena para envío

  /***vista previa de ADN */
  public textAreaGetAdn: Array<string>;//cadena de ADN del textarea en forma de array
  public textAreaContainer: string;//elementos de la cadena en forma de string
  public binding: string;//Captura del elemento tecleado

  /*** variable para la validavion de comal al pegar elementos en textarea */
  public validacionPegado: boolean = false;

  //@ViewChild("TA") TA!: ElementRef;

  mensaje: any = 'sin nada que hacer';

  constructor(
    private _DataDbService: DataDbService
  ){
    this.adnForm = new FormGroup({
      adnString: new FormControl()
    });
    this.cadenasPost = new Cadena([])
    this.cadenasGetAdn = new Array();
    this.textAreaGetAdn = [];
    this.textAreaContainer = "";
    this.binding = "";
  }

  ngOnInit() {
    this.mostarAdnsApi();
  }

  /*** utilidades ***/
  limpiarFormulario(){
    this.adnForm.reset();
  }

  //Obtener resultados de GET
  mostarAdnsApi(){
    this._DataDbService.getAdnApi().subscribe(
      result =>{
        this.cadenasGet = result;
        this.cadenasGetAdn = [];
        for(let i in this.cadenasGet){
          let xd = this.cadenasGet[i].adn;
          this.cadenasGetAdn.push(xd);
        }
      },
      error =>{
        console.log(<any>error);
      }
    )
  }

  //VALIDACIONES textarea
  val_Comas(event: any){
    let tieneComa = event.indexOf(',');
      if (tieneComa != -1) {
        let indiceComa = this.textAreaContainer.lastIndexOf(',');
        this.textAreaContainer =  this.textAreaContainer.slice(0, indiceComa + 1);
        this.textAreaGetAdn = this.textAreaContainer.split(',');
        this.limpiarFormulario();
        return true
      }else return false;
  }

  val_tamañoMatriz(arrayAdn: Array<string>, textContainer: string){
    if (arrayAdn.length > 6) {
      arrayAdn.pop();
      textContainer = textContainer.slice(0, -2);
      this.limpiarFormulario();
      alert('la matriz de 6x6 ya se completo');
    }
  }

  //FUNCIONALIDAD textarea
  textareaForm2(event: any){
    //validacion de formulario vacio (necesario para cuando limpiamos el formulario)
    if(event != null){
      //validacion de "0 comas" para evitar errores en textAreaGetAdn
      //tambien se validan que no marque error por las comas cuando pegamos contenido
      if(this.val_Comas(event) && this.validacionPegado == false){
        alert('Ingrese solamente valores de bases nitrogenadas validas (A, T, C, G)')
      }else{
        let itemAdn = event;
        switch(this.binding){
          case 'letra':
            //agregamos ultima letra al container y actualizamos el array
            this.textAreaContainer += itemAdn.substr(-1);
            this.textAreaGetAdn = this.textAreaContainer.split(',');

            //validacion de tamaño de matriz
            this.val_tamañoMatriz(this.textAreaGetAdn, this.textAreaContainer);

            //generamos la fila de la matriz (recordemos que cada fila es un item del array textAreaGetAdn)
            if(itemAdn.length == 6){
              itemAdn += ",";
              this.textAreaContainer += itemAdn.substr(-1);
              this.textAreaGetAdn = this.textAreaContainer.split(',');
              this.textAreaGetAdn.pop();
              this.limpiarFormulario();
            }
            break;
          case 'borrar':
            //Borramos el ultimo elemento
            this.textAreaContainer = this.textAreaContainer.substring(0, this.textAreaContainer.length - 1);
            this.textAreaGetAdn = this.textAreaContainer.split(',');
            break;
          case 'pegado':
            //verificamos la lingitud para ver si es una cadena completa
            if(event.length == 41){
              this.textAreaContainer = event;
              this.textAreaGetAdn = this.textAreaContainer.split(',');
              // console.log(this.textAreaGetAdn);
              this.validacionPegado = false;
            }else{
              alert('el valor a pegar debe ser la cadena completa separada por comas');
              this.limpiarFormulario();
              this.textAreaContainer = '';
              this.textAreaGetAdn = this.textAreaContainer.split(',');
            }
            break;
        }
      }
    }else{
      //console.log('no se hizo la machaca')
    }
  }

  /*** Validamos la interaccion del usuario con el teclado */
  public capturaTecla(event: KeyboardEvent){
    let i =  event.key;
    let response = ""
    //valores validos
    switch (i) {
      case 'a': case 'A':
      case 't': case 'T':
      case 'c': case 'C':
      case 'g': case 'G':
      case ',': 
        response = 'letra'
        //console.log('se apreto ATCG')
        break;
    //para cuando borramos elementos
    case 'Backspace':
      response = 'borrar'
      break;
    default:
      //para cuando presionamos ctrl + v
      if((event.ctrlKey || event.metaKey) && (event.key == 'v' || event.key == 'V')){
        //console.log('CTRL +  V');
        this.validacionPegado = true;
        response = 'pegado';
      }else{
        //console.log(event.key);
        event.preventDefault();
        response = 'nada'
      }
      break;
    }
    this.binding = response;
  }

  //submit
  onSubmitManual(){
    this.cadenasPost= new Cadena(this.textAreaGetAdn);
    this._DataDbService.addAdnApi(this.cadenasPost).subscribe(data =>{
      //console.log('se realizo el post parece ' + this.cadenasPost);
      alert('Se ha enviado la cadena de ADN a revision');
      this.textAreaGetAdn = [];
      this.limpiarFormulario();
      this.mostarAdnsApi();
    })
  }


  /*** Actalizacion de array realizada desde el preview */
  ActualizarAdn(e: any){
    //console.log(e);
    this.textAreaGetAdn[e.fila] = e.nuevaFila;
    this.mensaje = this.textAreaGetAdn;
    //console.log(this.textAreaGetAdn);
  }
  /*
    ATGCGA,CAGTGC,TTATTT,AGACGG,GCGTCA,TCACTG - sin secuencias
    ATGCGA,CAGTGC,TTATGT,AGAAGG,CCCCTA,TCACTG - con mas de 2 secuencias
    ATGCGA,CAGTGC,TTTTTT,AGACGG,GCGTCA,TCACTG - con 1 secuencia
    const adn = ["ATGCGA","CAGTGC","TTATGT","AGAAGG","CCCCTA","TCACTG"]; // con mas de 2 mutaciones
    const adnClean = ["ATGCGA","CAGTGC","TTATTT","AGACGG","GCGTCA","TCACTG"]; //sin mutaciones
    const adnSemiClean = ["ATGCGA","CAGTGC","TTTTTT","AGACGG","GCGTCA","TCACTG"]; //con 1 mutacion
  */
}
