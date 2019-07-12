# hyperdrive-benchmarks

A few simple benchmarks for hyperdrive.

## `node bench.js`

```
NANOBENCH version 2
> /usr/bin/node bench.js
>
> # local fs: 1000 * 4K (batch: 1)
> ok ~48 ms (0 s + 48091632 ns)
>
> # hyperdrive: 1000 * 4K (batch: 1)
> ok ~675 ms (0 s + 675026782 ns)
>
> # client: 1000 * 4K (batch: 1)
> ok ~1.31 s (1 s + 306483537 ns)
>
>
> ---
>
> # local fs: 1000 * 4K (batch: 100)
> ok ~67 ms (0 s + 66589082 ns)
>
> # hyperdrive: 1000 * 4K (batch: 100)
> ok ~488 ms (0 s + 487873347 ns)
>
> # client: 1000 * 4K (batch: 100)
> ok ~727 ms (0 s + 727270347 ns)
>
>
> ---
>
> # local fs: 1000 * 4K (batch: 1000)
> ok ~79 ms (0 s + 78934663 ns)
>
> # hyperdrive: 1000 * 4K (batch: 1000)
> ok ~436 ms (0 s + 435552247 ns)
>
> # client: 1000 * 4K (batch: 1000)
> ok ~698 ms (0 s + 697718412 ns)
>
>
> ---
>
> # local fs: 200 * 2M (batch: 1)
> ok ~147 ms (0 s + 146825916 ns)
>
> # hyperdrive: 200 * 2M (batch: 1)
> ok ~775 ms (0 s + 775041586 ns)
>
> # client: 200 * 2M (batch: 1)
> ok ~2.3 s (2 s + 302370689 ns)
```
