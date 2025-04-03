
describe('Constructor Class', () => {
    const config = require('../src/Config'); 
    config.load()
    
    const Westpac = require('../csv_parsers/westpac.js');
    let westpac;
    
    // beforeEach(() => {
    // });

    test('should be instantiated correctly', () => {

        
        westpac = new Westpac();
        expect(westpac).toBeDefined();
    });


    test('should be instantiated correctly', () => {
        westpac = new Westpac({fileName:"/tmp/x"});
        console.log(westpac)
        expect(westpac.fileName).toBeDefined();
        expect(westpac.identifier).toBe('westpac');
    });

});