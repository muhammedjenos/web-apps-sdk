describe('BCAPI.Models.FileSystem.File', function() {
    'use strict';
    
    var BcFile = BCAPI.Models.FileSystem.File;
    var BcFolder = BCAPI.Models.FileSystem.Folder;

    beforeEach(function() {
        BCAPI.Helper.Test.runTestServer();
        this.addMatchers({
            toBeLaterThan: function(date, errorMargin) {
                errorMargin = errorMargin || 0;
                var actual = this.actual.getTime();
                var compared = date.getTime();
                return actual >= (compared - errorMargin);
            }
        });
    });

    it('should allow to create a new file by uploading content', function() {
        var file = genFile();
        var content = randomString();
        var testStartTime = new Date();
        expect(file.get('type')).toBe('file');
        promiseScenario({
            'promise': function() {
                return file.upload(content).then(function() { return file.fetch(); });
            },
            'complete': function() {
                expect(file.get('lastModified')).toBeDefined();
                expect(file.get('size')).toBeDefined();
                expect(file.get('lastModified')).toBeLaterThan(testStartTime, 1000);
            }
        });
    });

    it('should download the same content that was uploaded', function() {
        var file = genFile();
        var content = randomString();
        promiseScenario({
            'promise': function() {
                return file.upload(content).then(function() {
                    return file.download();
                });
            },

            'complete': function(data) {
                expect(data).toBe(content);
            }
        });
    });

    it('should delete files', function() {
        var file = genFile();
        promiseScenario({
            'promise': function() {
                return file.upload(randomString()).then(function() {
                    return file.destroy().then(function() {
                        return file.fetch().then(function() {
                            return true;
                        }, function() {
                            var p = $.Deferred();
                            p.resolve(false);
                            return p;
                        });
                    });
                });
            },
            'complete': function(wasRetrieved) {
                expect(wasRetrieved).toBe(false);
            }
        });
    });

    it('should handle re-upload properly', function() {
        var file = genFile();
        var initialData = randomString();
        var newData = randomString();
        var creationTimestamp;
        promiseScenario({
            'promise': function() {
                return file.uploadAndFetch(initialData)
                    .done(function() {
                        creationTimestamp = file.get('lastModified');
                    })
                    .then(function() {
                        return file.uploadAndFetch(newData).then(function() {
                            return file.download(); 
                        });
                    });
            },
            'complete': function(downloadedData) {
                expect(downloadedData).toBe(newData);
                expect(file.get('lastModified')).toBeLaterThan(creationTimestamp);
            }
        });
    });

    it('should allow instantiation by path', function() {
        var f = new BcFile('/hello/world');
        expect(f.get('path')).toBe('/hello/world');
        expect(f.get('name')).toBe('world');
        expect(f.get('folderPath')).toBe('/hello');
    });

    it('should automatically add the root slash', function() {
        var f = new BcFile('folder/file');
        expect(f.get('path')).toBe('/folder/file');
        expect(f.get('name')).toBe('file');
        expect(f.get('folderPath')).toBe('/folder');
    });

    it('should allow instantiation with folder path and file name', function() {
        var f = new BcFile('/folder/path', {'name': 'file-name'});
        expect(f.get('path')).toBe('/folder/path/file-name');
        expect(f.get('name')).toBe('file-name');
        expect(f.get('folderPath')).toBe('/folder/path');
    });

    it('should allow instantiation with folder and file name', function() {
        var d = new BcFolder({'path': '/folder/path'});
        var f = new BcFile(d, {'name': 'file'});
        expect(f.get('path')).toBe('/folder/path/file');
        expect(f.get('name')).toBe('file');
        expect(f.get('folderPath')).toBe('/folder/path');
    })

    // Utility functions
    
    function randChar() {
        var possibleChars = 'abcdefghijklmnopqrstuvwxyz';
        var index = Math.floor(Math.random() * possibleChars.length);
        return possibleChars[index];
    }

    function randomString(size) {
        size = size || 32;
        return _.times(size, randChar).join('');
    }

    function genFileName() {
        return 'generated_' + randomString(12);
    }

    function promiseScenario(scenario) {
        var promiseFun = scenario.promise,
            promiseCompletion = scenario.complete,
            message = scenario.message || 'Promise in testing scenario',
            finished = false,
            success,
            result;
        runs(function() {
            var p = promiseFun();
            p.done(function(x) {
                result = x;
                finished = true;
                success = true;
            }).fail(function(jqXHR, textStatus, errorThrown) {
                console.log('Promise failed. Error status was: ' + textStatus + '. Error thrown was: ' + errorThrown);
                finished = true;
                success = false;
                console.log('Call has failed');
            });
        });
        waitsFor(function() { return finished; }, message, 2000);
        runs(function() {
            expect(success).toBeTruthy('Promise completion should be successful');
            if (success) {
                promiseCompletion(result);  
            }
        });
    }

    function genFile(directory) {
        directory = directory || BCAPI.Models.FileSystem.Root;
        var fileName = genFileName();
        return directory.file({
            'name': fileName
        });
    }

});