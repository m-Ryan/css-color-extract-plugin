# css-util-webpack-loader

---

Install
---

```js
npm install --save-dev css-util-webpack-loader

```

```js
yarn add --dev css-util-webpack-loader

```

> Loader 
> - globalSassLoader
> - unitConversionLoader
> - cssRulesReplaceLoader



Usage


---

=> unitConversionLoader

```js

// webpack.config.js
module.exports = {
    ...
    module: {
        rules: [{
            test: /\.css$/,
            use: [
                "style-loader", 
                "css-loader", 
                {
                 loader: require.resolve('css-util-webpack-loader/dist/unitConversionLoader'),
                 options: {
                    originUnit: 'px',
                    replaceUnit: 'rem',
                    precision: 5,
                    times: 0.01,
                 }
                }
            ]
        },{
            test: /\.scss$/,
            use: [
                "style-loader", 
                "css-loader", 
                {
                 loader: require.resolve('css-util-webpack-loader/dist/unitConversionLoader'),
                 options: {
                    originUnit: 'px',
                    replaceUnit: 'rem',
                    precision: 5,
                    times: 0.01,
                 }
                },
                "sass-loader", 
            ]
        }]
    }
};

```

before

```css

.header {
  width: 40px;
  height: 30px;
}

.logo {
  font-size: 24px;
  color: #fff;
}

```

after

```css
.header {
  width: .4rem;
  height: .3rem
}

.logo {
  font-size: .24rem;
  color: #fff
}


```

---

=> cssRulesReplaceLoader

```js

// webpack.config.js
module.exports = {
    ...
    module: {
        rules: [{
            test: /\.css$/,
            use: [
                "style-loader", 
                "css-loader", 
                {
                  loader: require.resolve('css-util-webpack-loader/dist/cssRulesReplaceLoader'),
                  options: {
                    rules: [{
                      name: 'color',
                      originValues: ['#ffffff', '#fff'],
                      replaceValue: '#108ec6'
                    }]
                  }
                }
            ]
        }]
    }
};

```

before

```css

a {
  color: #ffffff;
  background: #ffffff;
}

p {
  font-size: 24px;
  color: #fff;
}



```

after

```css
a {
  color: #108ec6;
  background: #ffffff;
}

p {
  font-size: 24px;
  color: #108ec6;
}


```

=> globalSassLoader

```js

// webpack.config.js
module.exports = {
    ...
    module: {
        rules: [{
            test: /\.scss$/,
            use: [
                "style-loader", 
                "css-loader", 
                "sass-loader", 
                {
                  loader: require.resolve('css-util-webpack-loader/dist/globalSassLoader'),
                  options: {
                    filePaths: [
                        require.resolve('../src/var.scss'),
                    ],
                  }
                }
            ]
        }]
    }
};

```

before

~var.scss

```scss

$primary-color: #067785;
$link-color: #067785;
$success-color: #52c41a;
$warning-color: #faad14; 
$error-color: #f5222d;
$font-size-base: 14px;
$heading-color: rgba(0, 0, 0, .85);
$text-color: rgba(0, 0, 0, .65);
$text-color-secondary : rgba(0, 0, 0, .45); 
$disabled-color : rgba(0, 0, 0, .25);
$border-radius-base: 4px;
$border-color-base: #d9d9d9;
$box-shadow-base: 0 2px 8px rgba(0, 0, 0, .15);

```
~header.scss 

```scss

.header {
  background-color: $success-color;
  font-size: 26px;
}

.logo {
  color: $primary-color;
  width: 200px;
}

```

after

~header.scss 

```scss
$primary-color: #067785;
$link-color: #067785;
$success-color: #52c41a;
$warning-color: #faad14; 
$error-color: #f5222d;
$font-size-base: 14px;
$heading-color: rgba(0, 0, 0, .85);
$text-color: rgba(0, 0, 0, .65);
$text-color-secondary : rgba(0, 0, 0, .45); 
$disabled-color : rgba(0, 0, 0, .25);
$border-radius-base: 4px;
$border-color-base: #d9d9d9;
$box-shadow-base: 0 2px 8px rgba(0, 0, 0, .15);

.header {
  background-color: $success-color;
  font-size: 26px;
}

.logo {
  color: $primary-color;
  width: 200px;
}

```
