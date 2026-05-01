export async function GET() {
    try {
        const res = await fetch(
            "https://hermes.pyth.network/v2/updates/price/latest?ids[]=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"
        );

        const data = await res.json();

        const priceObj = data.parsed?.[0]?.price;

        if (!priceObj) {
            throw new Error("Invalid Pyth response");
        }

        const price =
            Number(priceObj.price) * Math.pow(10, priceObj.expo);

        return Response.json({ price, source: "pyth" });

    } catch (e) {
        console.error("Pyth fetch failed", e);

        return Response.json(
            { price: null, error: "oracle_failed" },
            { status: 500 }
        );
    }
}