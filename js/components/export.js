(() => { 
  // node modules to use
  /*const fs = require('fs');
  const XLSX = require('xlsx');
  const excelbuilder = require('msexcel-builder');*/


  /**
   * Exports call data
   * @param {Object} callData The call data, an array of calls
   */  
  App.exportCalls = (callData) => {
    // create workbook
    const workbook = excelbuilder.createWorkbook('data/', 'exportedInventory.xlsx');
    const sheet = workbook.createSheet('FRCI', App.metadata.length, callData.length + 1);
    
    // populate workbook
    callData.forEach((call, j) => {
      const rowNum = j + 2;
      let colNum = 0;
      for (let ind in call) {
        const cn = call[ind];
        sheet.valign(colNum, rowNum, 'top');
        sheet.set(colNum, rowNum, r[cn]);

        colNum++;
      }
    });
    
    // file name
    const fileName = 'FOC_' + d3.time.format('%Y%m%d')(new Date()) + '.xlsx';

    // save workbook
    workbook.save((err) => {
      if (err) {
        workbook.cancel();
        noty({
          type: 'warning',
          text: 'There was an error exporting call data.<br>Please contact the developers.',
        });
        return;
      }
      const link = document.createElement('a');
      link.download = fileName;
      link.href = 'data/exportedInventory.xlsx';
      link.click();
    });
  };
})();
