function generateRandomEmail() {
    const randomString = Math.random().toString(36).substring(2, 10);
    const randomEmail = `user${randomString}@email.com`;
    return randomEmail;
}
describe('Api tests for login form', ()=>{
    beforeEach('open app',()=>{
        cy.openHomePage()
    })
    const userCredentials={
            "email": "customer@practicesoftwaretesting.com",
            "password": "welcome01"
    }
    const randomEmail = generateRandomEmail();
    const bodyRequestRegistration={
        "address": "Aleja lipa 56",
        "city": "Sarajevo",
        "country": "BA",
        "dob": "1999-02-20",
        "email": randomEmail,
        "first_name": "Selma",
        "last_name": "srydtfjkl",
        "password": "11111111",
        "phone": "22222222222",
        "postcode": "71000",
        "state": "Kanton Sarajevo"
    }
    const queryParams = {
        "by_category_slug": "hand-tools" 
    }

    const queryParamsSort = {
        "sort": "name,asc",
        "between": "price,1,100",
        "page": 0
    }

    const queryBrand = {
            "between":"price,1,100",
            "by_brand": '01HQ8ZK0KQR6J31ECTQMKK3FRQ',
            "page":0
    }

    let token
    it('verify login page',()=>{
        cy.request('POST', 'https://api.practicesoftwaretesting.com/users/login', userCredentials).then(response=>{
            token=response.body.access_token
            expect(response.status).to.eq(200)
            expect(token).to.be.a('string')
            expect(token).to.have.length.greaterThan(0)
        })            
    })
    it('verify registration page',()=>{
        //POST request for registration of user
        cy.request('POST','https://api.practicesoftwaretesting.com/users/register',bodyRequestRegistration).then(response=>{
            expect(response.status).to.eq(201)
            expect(response.body.email).to.be.eq(bodyRequestRegistration.email)
            expect(response.duration).to.be.lessThan(500)
            expect(response.body).to.have.property('email')
            expect(response.body.email).to.be.a('string')
        })  
    })
    it('verify cart page ',()=>{
        
        let productId
        let cartId
        let handTools = []
        let toolCategory
        //GET request - for category hand tools
        cy.request({
            url: 'https://api.practicesoftwaretesting.com/products?page=1&by_category_slug=hand-tools',
            method: 'GET',
            qs: queryParams,
            headers: {"Authorization":'Bearer '+ token}
        }).then(response => {
            expect(response.status).to.equal(200)
            productId=response.body.data[0].id
            expect(response.body).to.have.property('data').that.is.an('array').and.is.not.empty
            expect(response.body.data[0].id).to.be.a('string')
                            
            //POST request - put item in cart and create cart
            cy.request({
                url: 'https://api.practicesoftwaretesting.com/carts',
                method: 'POST',
                body:{},
                headers: {"Authorization":'Bearer '+ token}  
            }).then(response=>{  
                expect(response.status).to.eq(201)
                expect(response.body).to.have.property('id')
                cartId=response.body.id
            
                //POST request - put item in cart
                cy.request({
                    method:'POST', 
                    headers: {"Authorization":'Bearer '+ token},
                    url:'https://api.practicesoftwaretesting.com/carts/'+cartId,
                    body:{"product_id": productId,
                          "quantity": 1}
                }).then(response=>{
                    expect(response.status).to.eq(200)
                    expect(response.body.result).to.eq('item added or updated')
                })
                //GET request - get items from cart
                cy.request({
                    method:'GET', 
                    headers: {"Authorization":'Bearer '+ token},
                    url:'https://api.practicesoftwaretesting.com/carts/'+cartId
                }).then(response=>{
                    expect(response.status).to.eq(200)
                    expect(response.body.cart_items[0].cart_id).to.be.eq(cartId)
                    expect(response.body.cart_items[0].product_id).to.be.eq(productId)
                })
                
                //POST request - finish cart payment
                cy.request({
                    url: 'https://api.practicesoftwaretesting.com/invoices',
                    method: 'POST',
                    headers: {"Authorization":'Bearer '+ token},
                    body: {
                        "billing_address": "Test street 98",
                        "billing_city": "Vienna",
                        "billing_country": "Austria",
                        "billing_postcode": "11111",
                        "billing_state": "Kanton Sarajevo",
                        "cart_id": cartId,
                        "payment_method": "Cash on Delivery"
                    }
                }).then(response => {
                    expect(response.status).to.equal(201)
                })

                //DELETE request - delete cart
                cy.request({
                    url: 'https://api.practicesoftwaretesting.com/carts/'+cartId,
                    method: 'DELETE',
                    headers: {"Authorization":'Bearer '+ token}
                }).then(response => {
                    expect(response.status).to.equal(204)
                })
            })
        })  
        
        cy.request({
            method:'GET',
            url:'https://api.practicesoftwaretesting.com/users/me',
            headers: {"Authorization":'Bearer '+ token}
        }).then(response=>{
            expect(response.status).to.eq(200)
            expect(response.duration).to.be.lessThan(500)
        })

        //POST request - cart payment
        cy.request({
            url: 'https://api.practicesoftwaretesting.com/payment/check',
            method: 'POST',
            headers: {"Authorization":'Bearer '+ token},
            body: {"payment_method": "Cash on Delivery",}
        }).then(response => {
            expect(response.status).to.equal(200)
            expect(response.body.message).to.eq('Payment was successful')
        })
        
        //GET request for products in price range from 0 to 100 and sort name from A-Z
         cy.request({
            url: 'https://api.practicesoftwaretesting.com/products',
            method: 'GET',
            headers: {"Authorization":'Bearer '+ token},
            qs: queryParamsSort
        }).then(response => {
            expect(response.status).to.equal(200)
            response.body.data.forEach(product => {
                expect(product.stock).to.be.a('number').that.is.at.least(0)
                expect(product.price).to.be.a('number').that.is.at.least(0)
            })
        })
        
        //GET request for products in price range from 0 to 100 and price(high-low)
        cy.request({
            url: 'https://api.practicesoftwaretesting.com/products?sort=price,desc&between=price,1,100&page=0',
            method: 'GET',
            headers: {"Authorization":'Bearer '+ token}
        }).then(response => {
            expect(response.status).to.equal(200)
            response.body.data.forEach(product => {
                expect(product.stock).to.be.a('number').that.is.at.least(0)
                expect(product.price).to.be.a('number').that.is.at.least(0)
            })
        })

        //GET request - Search by name "tool" and get all products
        cy.request({
            url: 'https://api.practicesoftwaretesting.com/products',
            method: 'GET',
            headers: {"Authorization":'Bearer '+ token},
            qs: {"q" : "tool"}
        }).then(response => {
            expect(response.status).to.equal(200)
            response.body.data.forEach(product => {
                expect(product.stock).to.be.a('number').that.is.at.least(0)
                expect(product.price).to.be.a('number').that.is.at.least(0)
                expect(product.name.toLowerCase()).to.include('tool')
            })
        })

        //GET request - all categories slug='hand-tools' and save all category_id
        cy.request({
            url: 'https://api.practicesoftwaretesting.com/categories/tree?by_category_slug=hand-tools',
            method: 'GET',
            headers: {"Authorization":'Bearer '+ token}
        }).then(response => {
            expect(response.status).to.equal(200)
            toolCategory=response.body[0].id
            handTools.push(toolCategory)
            response.body[0].sub_categories.forEach(categories => {
                handTools.push(categories.id);
            console.log("list" + " "  +handTools)
            })
        })

        //GET request - get all products by category hand-tools - Filters
        cy.request({
            url: 'https://api.practicesoftwaretesting.com/products',
            method: 'GET',
            headers: {"Authorization":'Bearer '+ token},
            qs:{
                "between":"price,1,100",
                "by_category": toolCategory,
                "page":0
            }
        }).then(response => {
            expect(response.status).to.equal(200)
            response.body.data.forEach(product => {
                expect(handTools).to.include(product.category_id)
                expect(product.stock).to.be.a('number').that.is.at.least(0)
                expect(product.price).to.be.a('number').that.is.at.least(0)
            })
        })

        //GET request - get all products by brand - Filters
        cy.request({
            url: 'https://api.practicesoftwaretesting.com/products',
            method: 'GET',
            headers: {"Authorization":'Bearer '+ token},
            qs: queryBrand
        }).then(response => {
            expect(response.status).to.equal(200)
            response.body.data.forEach(product => {
                expect(product.brand_id).is.eq(queryBrand.by_brand)
                expect(product.stock).to.be.a('number').that.is.at.least(0)
                expect(product.price).to.be.a('number').that.is.at.least(0)
            })
            console.log(response.body)
        })
    })

})