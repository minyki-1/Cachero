# Cachero

Enable cache all CRUD operations, a library for [Node.js](http://nodejs.org).

```js
const { createCachero } = require('cachero')

const cachero = createCachero()

await cachero.setting({ table, preloadData, pool, redis })

const result = await cachero.select({ column: ['*'] }, 'key')
```

<br>

## Installation

[NPM](https://www.npmjs.com/package/cachero)

```console
$ npm install cachero
```

<br>

## Features

  * Low latency CRUD
  * Easy CRUD cache
  * Reduces server load
  * Look-Aside + Write-Back caching
  * Easier than most ORM

<br>

## Example
Express Example
```js
const express = require('express');
const { createCachero } = require('cachero')
const { createClient } = require('redis')
const { Pool } = require('pg')

const pool = new Pool()
const redis = createClient()

const app = express()
const postCachero = createCachero()

app.get('/post', function (req, res) {
  const cachedKey = req.originalUrl

  const result = await postCachero.select({ 
    column: ['*']
  }, cachedKey)
  /* 
    Cached Key is used to determine whether the value is valid when reading multiple data. 
    You do not need to use it to get one data that you have already cached.
  */

  res.json(result)
})

app.listen(3000, async () => {
  await pool.connect()
  await redis.connect()

  await postCachero.setting({ table: 'post', queryRunner: pool, redis })
});
```

<br/>

More Clauses
```js
postCachero.select({
  column: [
    'post.*',
    'COALESCE(ARRAY_LENGTH(liked_user, 1), 0) AS like_count',
    'users.name AS owner_name'
  ],
  order: ['like_count DESC', 'created_at DESC'],
  where: {
    condition1: ['id', '=', '0'],
    condition2: ['like_count', '>=', '10'],
    result: ['condition1', '&&', 'condition2']
  },
  join: 'users ON lab.maker_id = users.id',
  limit: 0,
  offset: 0
}, 'key')
```

<br/>

Create, Update, Delete, Scheduler Example
```js
cachero.create({ id:'0', title:'new data' })

cachero.update({ id:'0', title:'update data' })

cachero.delete({ id: '0' })

cachero.scheduler([[12,0]])
```

<!-- ## Prototype -->

## License

  [MIT](LICENSE)