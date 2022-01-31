import { LightningElement, track, api } from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import csvFile from '@salesforce/apex/csvFileController.csvFileRead';
import getObjectName from '@salesforce/apex/csvFileController.getObjectName';
import getColumns from '@salesforce/apex/csvFileController.getColumns';
import getFields from '@salesforce/apex/csvFileController.getFields';

// const columnsAccount = [
//     { label: 'Name', fieldName: 'Name' }, 
//     { label: 'Source', fieldName: 'AccountSource' },
//     { label: 'Account Site', fieldName: 'Site'}, 
//     { label: 'Type', fieldName: 'Type'}, 
//     { label: 'Website', fieldName: 'Website', type:'url'}
// ];

export default class dataFromCSVFile extends LightningElement {
    value;
    objectList = [];
    objects = [];
    showUploader = false;
    dataAvailable = false;

    sheetUploaded =  false;

    docId;
    csvFieldName=[];
    // columns = [];
    columnsObjectIterable = [];
    @api recordId;
    @track error;
    @track columnsObject;   
    @track data;

    //dualListBox(field mapping)
     _selectedFields = [];
     fields = [];

     get FieldOptions() {
        return this.fields;
    }

    get selected() {
        return this._selectedFields.length ? this._selectedFields : 'none';
    }

    handleFieldChange(event) {
        this._selectedFields = event.detail.value;
    }


    connectedCallback() {
        getObjectName()
            .then(result => {
                this.objects = result;
                for (let o in this.objects) {
                    this.objectList = [...this.objectList, { label: this.objects[o], value: this.objects[o] }];
                }
            })
            .catch(error => {
                // Handle error. Details in error.message.
                console.log(error);
            });
    }

    get objectList(){
        return this.objectList;
    }

    get value(){
        return this.value;
    }
    handleChange(event) {
        this.value = event.detail.value;
        // console.log('Hello ' + this.value);
        this.connectedCallback();
        this.showUploader = true;
        this.dataAvailable = false;
        this._selectedFields = [];
        this.sheetUploaded = false;
        this.Fields = [];
    }

    // accepted parameters
    get acceptedCSVFormats() {
        return ['.csv'];
    }
    
    uploadFileHandler(event) {
        // Get the list of records from the uploaded files
        const uploadedFiles = event.detail.files;
        // console.log(uploadedFiles);
        // console.log('Hi  ' + uploadedFiles[0].documentId);
        this.docId = uploadedFiles[0].documentId;

        //map fields by getting fields in dual list box
        getFields({sObjectAPIName : this.value})
        .then(result => {
            this.fields = [];
            for (let field in result) {
                this.fields = [...this.fields, { label: result[field], value: result[field] }];

            }
        })
        .catch(error => {
            console.log(error);
        });

        // calling apex class csvFileread method
        getColumns({
            contentDocumentId : this.docId,
            objectSelected : this.value
        })
        .then(result => {
            // this.columns = result;
            this.csvFieldName = result;
            this.columnsObjectIterable = [];
            for (let o in result) {
                this.columnsObjectIterable = [...this.columnsObjectIterable, { label: result[o].trim(), fieldName: result[o].trim() }];
            }
            this.columnsObject = this.columnsObjectIterable;
        })

        this.sheetUploaded = true;
        this.showUploader = false;

       /* */

    }

    handleUploadButton(event){
        this.sheetUploaded = false;
        
        
        csvFile({
            contentDocumentId : this.docId,
            objectSelected : this.value,
            csvFieldName : this._selectedFields
        })
        .then(result => {
            console.log('result ===> '+result);
            this.columnsObject = [];
            for (let o in this._selectedFields) {
                this.columnsObject = [...this.columnsObject, { label: this._selectedFields[o].trim(), fieldName: this._selectedFields[o].trim() }];
            }
            console.log('Hi there '+ this.columnsObject);
            this.data = result;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!!',
                    message: 'Object records are created according to the CSV file upload!!!',
                    variant: 'Success',
                }),
            );
        })
        .catch(error => {
            this.error = error;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error!!',
                    message: JSON.stringify(error),
                    variant: 'error',
                }),
            );     
        })

        this.dataAvailable = true;
    }
}