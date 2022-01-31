public inherited sharing class csvFileController {

    @AuraEnabled
    public static List<String> getObjectName() {
      List<String> objects = new List<String>();
      List<Schema.SObjectType> sObjectList = Schema.getGlobalDescribe().Values();
      for (SObjectType sObjectType : sObjectList) {
        objects.add(sObjectType.getDescribe().getName());
      }
      objects.sort();
      // System.debug(objects);
      return objects;
    }

    @AuraEnabled
    public static List<String> getColumns(Id contentDocumentId, String objectSelected){
        List<String> returnList = new List<String>();
        // Fetch File Data based on the basic of document id 
        ContentVersion contentVersionObj = [SELECT Id, VersionData FROM ContentVersion WHERE ContentDocumentId =:contentDocumentId];
        // split the file data
        list<String> csvRecordsList = contentVersionObj.VersionData.toString().split('\n');
        returnList = csvRecordsList[0].split(',');

        return returnList;     
    }

    //get fields of selected object
    @AuraEnabled(cacheable=true)
    public static List<String> getFields(String sObjectAPIName) {
      List<String> response = new List<String>();
      List<String> fieldNames = new List<String>();
      String object_API_Name = sObjectAPIName;
      Map<String, Schema.SObjectField> M_Objects_Schema_Field = Schema.getGlobalDescribe()
        .get(object_API_Name)
        .getDescribe()
        .fields.getMap();
      for (String fieldName : M_Objects_Schema_Field.keySet()) {
        Schema.DescribeFieldResult fieldDescription = M_Objects_Schema_Field.get(
            fieldName
          )
          .getDescribe();
        fieldNames.add(fieldDescription.getName());
      }
      fieldNames.sort();
      return fieldNames;
    }

    @AuraEnabled
    public static list<sObject> csvFileRead(Id contentDocumentId, String objectSelected, List<String> csvFieldName){
        String object_API_Name = objectSelected;
        System.debug(object_API_Name);
        list<sObject> objectInsertList = new list<sObject>();
        
        if(contentDocumentId != null) {
            
            // Fetch File Data based on the basic of document id 
            ContentVersion contentVersionObj = [SELECT Id, VersionData FROM ContentVersion WHERE ContentDocumentId =:contentDocumentId];
            // split the file data
            list<String> csvRecordsList = contentVersionObj.VersionData.toString().split('\n');
            list<String> csvFieldNames = csvFieldName;

            for(Integer i = 1; i < csvRecordsList.size(); i++){
                // Account accountObj = new Account();
                sObject objectToInsert  = Schema.getGlobalDescribe().get(object_API_Name).newSObject();
                // System.debug(objectToInsert);
                list<String> csvRowData = csvRecordsList[i].split(',');
                System.debug(csvRowData);
                // System.debug('csvRowData====> '+csvRowData);
                for (Integer j = 0; j < csvRowData.size(); j++) {
                    objectToInsert.put(csvFieldNames[j].trim(), csvRowData[j]);
                }
                objectInsertList.add(objectToInsert);                
            }

            try{    
                if(!objectInsertList.isEmpty()) {
                    insert objectInsertList; //Database.insert to pattially save correct data.
                }
            }
            catch (Exception ex) {
                throw new AuraHandledException(ex.getMessage());
            } 
        }
        return objectInsertList;    
    }
}
