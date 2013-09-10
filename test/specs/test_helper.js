describe("Helper.Site", function() {

    it("tries to use JQuery.cookie to get tokens", function() {
        spyOn($, "error");

        BCAPI.Helper.Site.getGenericToken();
        expect($.error).toHaveBeenCalled();

        BCAPI.Helper.Site.getSiteToken();
        expect($.error).toHaveBeenCalled();

        jasmine.getEnv().currentSpec.spyOn($, "cookie", true);

        BCAPI.Helper.Site.getGenericToken();
        expect($.cookie).toHaveBeenCalledWith('genericToken');

        BCAPI.Helper.Site.getSiteToken();
        expect($.cookie).toHaveBeenCalledWith('siteToken');

        expect(BCAPI.Helper.Site.getSiteId()).toBe('current');
    });

    it("getRootUrl() returns ''", function() {
        expect(BCAPI.Helper.Site.getRootUrl()).toBe("");
    });

});
