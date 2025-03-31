// Stub file for jspdf
class jsPDF {
  constructor(options) {
    this.options = options || {};
    this.internal = {
      pageSize: {
        getWidth: () => 595.28,
        getHeight: () => 841.89
      }
    };
  }

  addPage() {
    return this;
  }

  setFontSize() {
    return this;
  }

  setTextColor() {
    return this;
  }

  setFillColor() {
    return this;
  }

  rect() {
    return this;
  }

  text() {
    return this;
  }

  addImage() {
    return this;
  }

  save() {
    console.log('jsPDF save method called (stub)');
    return this;
  }

  output() {
    return 'data:application/pdf;base64,';
  }
}

export default jsPDF; 