# Cachero

*Enable cache all CRUD operations, a library for [Node.js](http://nodejs.org).*

![Cachero Logo](cachero.png "Cachero Logo")

```js
const { createCachero } = require('cachero')

const cachero = createCachero()

await cachero.setting({ table, queryRunner })

const result = await cachero.select()
```

<br>

## Installation

[NPM](https://www.npmjs.com/package/cachero)

```console
$ npm install cachero
```

<br>

## Features

  * Easy CRUD caching
  * Very low latency
  * Minimize the use of DB
  * Reduces server load
  * Look-Aside + Write-Back caching
  * Easier syntax than most ORM

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

  res.json(result)
})

app.listen(3000, async () => {
  await pool.connect()
  await redis.connect()

  await postCachero.setting({ table: 'post', refKey: 'id', queryRunner: pool, redis })
});
```

<br/>

More Usage
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
  join: 'users ON post.maker_id = users.id',
  limit: 0,
  offset: 0
})
```

<br/>

Create, Update, Delete, Scheduler Example
```js
// Create, Update, Delete have to send a refKey

cachero.create({ id:'0', title:'new data' })

cachero.update({ id:'0', title:'update data' })

cachero.delete({ id: '0' })

cachero.scheduler([[12,0]])
```

<br>

## setting
- You shuold setting before use cachero
- `refKey` is used as a reference value for saving, updating, and deleting data
- You don't have to send `preloadData`, `redis`
- If you send `preloadData`, it's saved and used before cachero get the data
- If you send `redis`, the data is also saved in redis 
  when data is saved in memory, which greatly increases stability

## select
- After you get all the columns of multiple data into `*` or `table.*`, 
  if you get the detailed data of one of them again, 
  cachero don't run sql query, so it's good for performance.
- `cachedKey` is used to determine whether the value is valid when reading multiple data. 
  Use it when you get multiple data, if you get the detailed data of one of them again, it doesn't have to be used

## delete
- You can erase only one specific value with an id value, 
  but even if you send another key value, it erases all that data

<br>

## License

  [MIT](LICENSE)